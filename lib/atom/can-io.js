var events = require('events'),
    util = require('util');

var udp = require('./can-io/udp'),
    protocol = require('./can-io/protocol');

function CanIO(config) {
  events.EventEmitter.call(this);

  this.config = config;
  this.ios = [];

  this.protocol = new protocol.Protocol(config.protocolFile);
  
  // create IOs
  var self = this;
  if (config.udp) {
    config.udp.forEach(function(udpConfig) {
      self.ios.push(self.createUDP(udpConfig));
    });
  }
  // bind IOs
  this.bindIOs();
}
util.inherits(CanIO, events.EventEmitter);

CanIO.prototype.createUDP = function(config) {
  return new udp.UDP(config.address, config.port);
};

CanIO.prototype.bindIOs = function() {
  var self = this;
  this.ios.forEach(function(io) {
    io.on('message', self.handleIOMessage.bind(self));
  });
};

CanIO.prototype.handleIOMessage = function(rawMessage) {
  // forward to other ios
  this.ios.forEach(function(nextIo) {
    if (rawMessage.io !== nextIo) {
      nextIo.send(rawMessage);
    }
  });
  
  // process message
  this.distributeMessage(rawMessage);
};

CanIO.prototype.distributeMessage = function(rawMessage) {
  this.emit('message', this.protocol.decode(rawMessage));
};
exports.CanIO = CanIO;
