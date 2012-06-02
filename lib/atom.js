var events = require('events'),
    util = require('util');

var CanIO = require('./atom/can-io').CanIO;
var Monitor = require('./atom/monitor').Monitor;

function Atom(config) {
  events.EventEmitter.call(this);
  var self = this;

  var canIO = new CanIO(config);
  canIO.on('message', function(message) {
    console.log('Got message', message);
  });
  canIO.on('error', function(err) {
    self.emit('error', err);
  });

  if (config.monitor)
  {
    var monitor = new Monitor(config, canIO);
  }
}

util.inherits(Atom, events.EventEmitter);

exports.Atom = Atom;
