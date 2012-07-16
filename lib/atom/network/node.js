var events = require('events'),
    util = require('util'),
    color = require('ansi-color').set;

var log = require('../logging');
var stateMachine = require('./state-machine.js'),
    module = require('./module');

var NODE_TIMEOUT = 15; // seconds

function Node(hwId, network) {
  events.EventEmitter.call(this);
  this.hwId = hwId;
  this.network = network;
  this.lastMessage = null;
  this.modules = [];

  this.timeout = null;
  
  this.stateMachine = new stateMachine.StateMachine({
    offline: {
      heartbeat  : 'awaiting_list'
    },
    awaiting_list: {
      heartbeat  : 'awaiting_list',
      timeout    : 'offline',
      list_done  : 'online'
    },
    online: {
      timeout    : 'offline',
      heartbeat  : 'online'
    }
  }, 'offline');

  this.bindTimeout();
  this.bindEvents();
}
util.inherits(Node, events.EventEmitter);

Node.prototype.bindEvents = function() {
  var self = this;
  this.stateMachine.on({ from: 'offline', to: 'awaiting_list' }, function() {
    log.info(color('+++ ', 'green') + self);
    this.sendListRequest();
  }.bind(this));
  
  this.stateMachine.on({ to: 'offline' }, function() {
    log.info(color('--- ', 'red') + self);
  });

  this.stateMachine.on({ event: 'list_done' }, function() {
    this.modules.forEach(function(module) {
      this.emit('module.connect', module);
    }.bind(this));
  }.bind(this));

  this.stateMachine.on({ from: 'online', notTo: 'online' }, function() {
    this.modules.forEach(function(module) {
      this.emit('module.disconnect', module);
    }.bind(this));
    this.modules = [];
  }.bind(this));
};

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

  if (message.header.className === 'nmt' &&
     message.header.commandName === 'Heartbeat') {
    this.stateMachine.trigger('heartbeat');    
  }

  if (message.header.directionFlagName === 'From_Owner' &&
      this['handle' + message.header.commandName + 'Response']) {
    this['handle' + message.header.commandName + 'Response'](message);
  }
};

Node.prototype.handleListResponse = function(message) {
  var mod = new module.Module(this, {
    moduleTypeName: message.header.moduleTypeName,
    moduleId: message.header.moduleId
  });
  this.modules.push(mod);
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