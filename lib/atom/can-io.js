var events = require('events'),
    util = require('util');

var udp = require('./can-io/udp'),
    legacy = require('./can-io/legacy'),
    protocol = require('./can-io/protocol');

function CanIO(config) {
  events.EventEmitter.call(this);

  var self = this;
  this.config = config;
  this.ios = [];

  this.protocol = new protocol.Protocol(config.protocolFile);

  // create IOs
  if (config.udp) {
    config.udp.forEach(function(udpConfig) {
      var io = self.createUDP(udpConfig);

      self.ios.push(io);
    });
  }

  if (config.legacy) {
    config.legacy.forEach(function(legacyConfig) {
      var io = self.createLegacy(legacyConfig);

      self.ios.push(io);
    });
  }


  // bind IOs
  this.bindIOs();

  // Send pings to ios
  this.sendPings();
}
util.inherits(CanIO, events.EventEmitter);

CanIO.prototype.createUDP = function(config) {
  return new udp.UDP(config.address, config.port);
};

CanIO.prototype.createLegacy = function(config) {
  return new legacy.Legacy(config.port);
};


CanIO.prototype.bindIOs = function() {
  var self = this;
  this.ios.forEach(function(io) {
    io.on('message', self.handleIOMessage.bind(self));
  });
};

CanIO.prototype.sendPings = function() {
  var self = this;
  this.ios.forEach(function(io) {
    io.send({ data: new Buffer([251]) });
  });
};

CanIO.prototype.handleIOMessage = function(rawMessage) {
  // Check if we got a pong
  if (rawMessage.data[0] == 251)
  {
    console.log('Got pong!');
  } else {
    // TODO: Validate that we have packet start (253) and a packet end (250)!

    // forward to other ios
    this.ios.forEach(function(nextIo) {
      if (rawMessage.io !== nextIo) {
        nextIo.send(rawMessage);
      }
    });

    // process message
    this.distributeMessage(rawMessage);
  }
};

CanIO.prototype.distributeMessage = function(rawMessage) {
  this.emit('message', this.protocol.decode(rawMessage));
};

CanIO.prototype.send = function(message) {
  var rawMessage = this.protocol.encode(message);
  this.ios.forEach(function(io, i) {
    io.send(rawMessage);
  });
  this.emit('message', message);
};

exports.CanIO = CanIO;

