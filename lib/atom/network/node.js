var color = require('ansi-color').set;

var stateMachine = require('./state-machine.js');

var NODE_TIMEOUT = 10; // seconds

function Node(hwId) {
  this.hwId = hwId;
  this.lastMessage = null;
  
  this.stateMachine = new stateMachine.StateMachine({
    online: {
      nmt_heartbeat: 'online',
      timeout: 'offline'
    },
    offline: {
      nmt_heartbeat: 'online'
    }
  }, 'offline');

  var self = this;
  this.stateMachine.onTransition('offline', 'online', function() {
    console.log(color('+++ ', 'green') + self + ' online.');
  });
  this.stateMachine.onTransition('online', 'offline', function() {
    console.log(color('--- ', 'red') + self + ' offline.');
  });

}

Node.prototype.toString = function() {
  return "<Node id:" + this.hwId + " state:" + this.stateMachine.currentStateKey + ">";
};

Node.prototype.bindTimeout = function() {
  var self = this;
  var timeout = null;
  this.stateMachine.onTransition('offline', 'online', function() {
    self.restartTimeout(timeout);
  });
  this.restartTimeout(timeout);
};

Node.prototype.restartTimeout = function(timeout) {
  var self = this;
  clearTimeout(timeout);
  timeout = setTimeout(function() {
    console.log('triggering timeout');
    self.stateMachine.trigger('timeout');
  }, NODE_TIMEOUT * 1000);
};

Node.prototype.triggerMessage = function(message) {
  this.lastMessage = new Date();
  var eventName = message.header.className + '_' + message.header.commandName;
  this.stateMachine.trigger(eventName.toLowerCase());
};

Node.prototype.toJSON = function() {
  return {
    hwId: this.hwId,
    state: this.stateMachine.currentStateKey,
    lastMessage: this.lastMessage
  };
};

exports.Node = Node;