var events = require('events'),
    util = require('util');

var canio = require('./atom/can-io'),
    monitor = require('./atom/monitor'),
    commandio = require('./atom/command-io'),
    network = require('./atom/network'),
    command = require('./atom/command-io/command'),
    unit = require('./atom/unit');

function Atom(config) {
  events.EventEmitter.call(this);
  var self = this;

  this.commandIO = null;
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
    this.commandIO.registerCommand(new command.Command(this, 'version', version));
  }

  this.network = new network.Network(config, this.canIO, this.commandIO);

  // this.on('canMessage', function(message) {
  //   console.log(message);
  // });

  if (config.unitConfigFile) {
    this.unitManager = new unit.Manager(this.canIO, this.network, config);
  }
}

function version(session) {
  return "2.0.0";
}


util.inherits(Atom, events.EventEmitter);

exports.Atom = Atom;

