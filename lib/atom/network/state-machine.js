function StateMachine(states, defaultState) {
  this.states = states;
  this.currentStateKey = defaultState;
  this.stateCallbacks = {};
}

StateMachine.prototype.getCurrentState = function() {
  return this.states[this.currentStateKey];
};

StateMachine.prototype.trigger = function(event) {
  var state = this.getCurrentState();
  if (state[event]) {
    this.emit(state[event], this.currentStateKey);
    this.currentStateKey = state[event];
  }
};

StateMachine.prototype.emit = function(newState, oldState) {
  var enter, exit, to;
  var callbackLists = [
    (enter = this.stateCallbacks[newState]) && enter['enter'],
    (exit = this.stateCallbacks[oldState]) && exit['exit'],
    (to = this.stateCallbacks[oldState]) && (to = to['to']) && to[newState]
  ];
  callbackLists.forEach(function(list) {
    if (list) {
      list.forEach(function(callback) {
        callback.call(this, newState, oldState);
      });
    }
  });
};

StateMachine.prototype.onEnterState = function(state, callback) {
  var to = this.stateCallbacks[state] = this.stateCallbacks[state] || {};
  var enter = to['enter'] = to['enter'] || [];
  enter.push(callback);
};

StateMachine.prototype.onExitState = function(state, callback) {
  var from = this.stateCallbacks[state] = this.stateCallbacks[state] || {};
  var exit = from['exit'] = from['exit'] || [];
  exit.push(callback);
};

StateMachine.prototype.onTransition = function(fromState, toState, callback) {
  var from = this.stateCallbacks[fromState] = this.stateCallbacks[fromState] || {};
  var to = from['to'] = from['to'] || [];
  var arr = to[toState] = to[toState] || [];
  arr.push(callback);
};

exports.StateMachine = StateMachine;