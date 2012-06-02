var dgram = require("dgram"),
    events = require('events'),
    sys = require('sys');

var rawmessage = require('./raw-message');

function UDP(address, port) {
  events.EventEmitter.call(this);

  this.address = address;
  this.port = port;

  this.server = dgram.createSocket("udp4");

  this.server.on("message", this.messageHandler.bind(this));

  var self = this;
  this.server.on("listening", function () {
    var address = self.server.address();
    console.log("server listening " +
                address.address + ":" + address.port);
  });

  this.server.bind(this.port);

  this.send({ data: new Buffer([251]) });
}
sys.inherits(UDP, events.EventEmitter);

UDP.prototype.messageHandler = function(msg, rinfo) {
  if (rinfo) {
    console.log("server got: " + msg + " from " +
                rinfo.address + ":" + rinfo.port);
  }
  this.emit('message', new rawmessage.RawMessage(msg, this));
};

UDP.prototype.send = function(rawMessage) {
  var message = rawMessage.data;
  this.server.send(message, 0, message.length, this.port, this.address, function(err, bytes) {
    // server.close();
  });
};

exports.UDP = UDP;