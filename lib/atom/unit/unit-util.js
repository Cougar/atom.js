var util = require('util'),
    events = require('events');

var interfaces = require('./interfaces');

function Metadata(emitter) {
  this.emitter = emitter;
  this.data = {};
}

Metadata.prototype.set = function(name, value) {
  var oldValue = this.data[name];
  this.data[name] = value;
  this.emitter.emit('meta:' + name, value, oldValue);
};

Metadata.prototype.get = function(name) {
  return this.data[name];
};

function BaseUnit(config, canIO) {
  events.EventEmitter.call(this);
  this.config = config;
  this.metadata = new Metadata(this);
  this.canIO = canIO;
}
util.inherits(BaseUnit, events.EventEmitter);

BaseUnit.prototype.implement = function(interfaceName, metadataOverrides, callback) {
  if (arguments.length < 3) {
    callback = function() {};
  }
  if (arguments.length < 2) {
    metadataOverrides = [];
  }

  var theInterface = interfaces[interfaceName];
  var interfaceMetadata = theInterface.metadataDef;
  Object.keys(interfaceMetadata).forEach(function(metadataName) {
    if (metadataOverrides.indexOf(metadataName) === -1) {
      interfaceMetadata[metadataName].call(this);
    }
  }.bind(this));

  theInterface.getCommands().forEach(function(cmd) {
    this[cmd] = theInterface[cmd];
  }.bind(this));
};

BaseUnit.prototype.send = function(message) {
  this.canIO.send(message);
};

exports.createUnit = function(callback) {
  return function(config, canIO) {
    var unit = new BaseUnit(config, canIO);
    callback.call(unit);
    return unit;
  };
};

