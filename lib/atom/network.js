var events = require('events'),
    util = require('util');

var log = require('./logging'),
    command = require('./command-io/command'),
    node = require('./network/node');

function Network(config, canIO, commandIO) {
  events.EventEmitter.call(this);
  this.config = config;
  this.canIO = canIO;
  this.commandIO = commandIO;
  
  this.nodes = {};
  this.registerCanListener();

  this.commandIO.registerCommand(new command.Command(this, 'nodes', this.getNodes.bind(this)));
  this.commandIO.registerCommand(new command.Command(this, 'modules', this.getModules.bind(this)));
}
util.inherits(Network, events.EventEmitter);

Network.prototype.registerCanListener = function() {
  var self = this;
  this.canIO.on('message', function(message) {
    self.handleMessage(message);
  });
};

Network.prototype.handleMessage = function(message) {
  var hwId = (hwId = message.body.HardwareId) && hwId.toString(16);
  if (hwId) {
    var hwNode = this.nodes[hwId];
    if (!hwNode) {
      hwNode = this.nodes[hwId] = new node.Node(hwId, this);
      this.bindNodeEvents(hwNode);
    }
    hwNode.receiveCanMessage(message);
  }
};

Network.prototype.bindNodeEvents = function(node) {
  node.on('module.connect', function(module) {
    log.info(module + ' discovered on ' + module.node);
    this.emit('module.connect', module);
  }.bind(this));
  node.on('module.disconnect', function(module) {
    log.info(module + ' disconnected from ' + module.node);
    this.emit('module.disconnect', module);
  }.bind(this));
};

Network.prototype.getNodes = function() {
  return Object.keys(this.nodes).map(function(id) {
    return this.nodes[id];
  }.bind(this));
};

Network.prototype.getModules = function() {
  return this.getNodes().reduce(function(modules, node) {
    return modules.concat(node.getModules());
  }.bind(this), []);
};

Network.prototype.sendCanMessage = function(message) {
  this.canIO.send(message);
};

exports.Network = Network;