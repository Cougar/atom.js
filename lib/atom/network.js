var command = require('./command-io/command');

var node = require('./network/node');

function Network(config, canIO, commandIO) {
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
    }
    hwNode.receiveCanMessage(message);
  }
};

Network.prototype.getNodes = function() {
  return this.nodes;
};

Network.prototype.sendCanMessage = function(message) {
  this.canIO.send(message);
};

exports.Network = Network;