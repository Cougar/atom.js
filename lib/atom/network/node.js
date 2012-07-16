var color = require('ansi-color').set;

var log = require('../logging');
var stateMachine = require('./state-machine.js');

var NODE_TIMEOUT = 15; // seconds

function Node(hwId, network) {
  this.hwId = hwId;
  this.network = network;
  this.lastMessage = null;
  this.modules = [];

  this.timeout = null;
  
  this.stateMachine = new stateMachine.StateMachine({
    offline: {
      nmt_heartbeat  : 'awaiting_list'
    },
    awaiting_list: {
      nmt_heartbeat  : 'awaiting_list',
      timeout        : 'offline',
      list_done      : 'online'
    },
    online: {
      timeout        : 'offline',
      nmt_heartbeat  : 'online'
    }
  }, 'offline');

  this.bindTimeout();
  
  var self = this;
  this.stateMachine.on({ from: 'offline', to: 'awaiting_list' }, function() {
    log.info(color('+++ ', 'green') + self);
    this.sendListRequest();
  }.bind(this));
  this.stateMachine.on({ to: 'offline' }, function() {
    log.info(color('--- ', 'red') + self);
  });
}

Node.prototype.getState = function() {
  return this.stateMachine.getStateName();
};

Node.prototype.bindTimeout = function() {
  var self = this;
  this.stateMachine.on({ to: 'online' }, function() {
    self.restartTimeout();
  });
  self.restartTimeout();
};

Node.prototype.restartTimeout = function() {
  var self = this;
  clearTimeout(this.timeout);
  this.timeout = setTimeout(function(a, b, c) {
    self.stateMachine.trigger('timeout');
  }, NODE_TIMEOUT * 1000);
};

Node.prototype.receiveCanMessage = function(message) {
  this.lastMessage = new Date();
  var eventName = message.header.className + '_' + message.header.commandName;
  this.stateMachine.trigger(eventName.toLowerCase());

  if (message.header.directionFlagName === 'From_Owner' &&
      this['handle' + message.header.commandName + 'Response']) {
    this['handle' + message.header.commandName + 'Response'](message);
  }
};

Node.prototype.handleListResponse = function(message) {
  this.modules.push({
    moduleTypeName: message.header.moduleTypeName,
    moduleId: message.header.moduleId
  });
  if (message.body.SequenceNumber == message.body.NumberOfModules) {
    this.stateMachine.trigger('list_done');
  }
};

Node.prototype.sendListRequest = function() {
  this.modules = [];
  var message = {
    header: {
      className: 'mnmt',
      directionFlagName: 'To_Owner',
      commandName: 'List'
    },
    body: {
      HardwareId: parseInt(this.hwId, 16)
    }
  };
  this.network.sendCanMessage(message);
  this.stateMachine.trigger('list_request');
};

Node.prototype.toJSON = function() {
  return {
    hwId: this.hwId,
    state: this.stateMachine.currentStateKey,
    lastMessage: this.lastMessage,
    modules: this.modules
  };
};

Node.prototype.toString = function() {
  return "<Node id:" + this.hwId + " state:" + this.stateMachine.currentStateKey + " lastMessage:" + (this.lastMessage.getTime() - new Date().getTime()) + "ms modules:" + this.modules.length +">";
};

exports.Node = Node;