var net = require('net'),
    events = require('events'),
    util = require('util');

var log = require('../logging'),
    rawmessage = require('./raw-message');

function TCP(address, port, callback) {
  events.EventEmitter.call(this);

  this.address = address;
  this.port = port;
  this.retries = 0;

  this.connect(callback);
}
util.inherits(TCP, events.EventEmitter);

TCP.prototype.connect = function(callback) {
  this.client = net.connect(this.port, function() {
    if (callback) {
      callback();
    }
    log.info("CanIO-TCP connected to " +
             this.address + ":" + this.port);
  }.bind(this));

  this.client.setNoDelay(true);
  this.client.setKeepAlive(true, 50);

  this.client.on("data", this.messageHandler.bind(this));

  this.client.on("end", function () {
    this.retries++;
    var next = this.retries * this.retries;
    log.info('CanIO-TCP: Connection lost. Reconnecting in ' + next + 's');
    setTimeout(function() {
      this.connect();
    }.bind(this), next * 1000);
  }.bind(this));
};

TCP.prototype.messageHandler = function(msg) {
  this.emit('message', new rawmessage.RawMessage(msg, this));
};

TCP.prototype.send = function(rawMessage) {
  var message = rawMessage.data;
  this.client.write(message);
};

exports.TCP = TCP;
