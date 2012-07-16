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

  this.commandIO.registerCommand(new command.Command(this, 'nodes', function() {
    var nodes = [];
    for (var i in this.nodes) {
      nodes.push(this.nodes[i]);
    }
    return nodes;
  }));
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
  });
  node.on('module.disconnect', function(module) {
    log.info(module + ' disconnected from ' + module.node);
  });
};

Network.prototype.getNodes = function() {
  return this.nodes;
};

Network.prototype.sendCanMessage = function(message) {
  this.canIO.send(message);
};

exports.Network = Network;