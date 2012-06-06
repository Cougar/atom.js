var events = require('events'),
    util = require('util');

var canio = require('./atom/can-io'),
    monitor = require('./atom/monitor'),
    commandio = require('./atom/command-io');

function Atom(config) {
  events.EventEmitter.call(this);
  var self = this;

  this.commandIO = null;
  this.canIO = null;
  this.monitor = null;

  this.canIO = new canio.CanIO(config);

    this.canIO.on('message', function(message) {
    self.emit('canMessage', message);
  });

  this.canIO.on('error', function(err) {
    self.emit('canError', err);
  });

  if (config.monitor)
  {
    this.monitor = new monitor.Monitor(config, this.canIO);
  }

  if (config.command)
  {
    this.commandIO = new commandio.CommandIO(config);

    this.commandIO.registerCommand(this, version);
  }
}

function version(client) {
  return {
    logs: [
      "Version: 2.0.0"
    ]
  };
}

util.inherits(Atom, events.EventEmitter);

exports.Atom = Atom;

