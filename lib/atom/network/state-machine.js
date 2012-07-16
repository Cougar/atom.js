function StateMachine(states, defaultState) {
  this.states = states;
  this.currentStateKey = defaultState;
  this.stateCallbacks = [];
  this.stateCallbacksTriggers = [];
}

StateMachine.prototype.getStateName = function() {
  return this.currentStateKey;
};

StateMachine.prototype.getCurrentState = function() {
  return this.states[this.currentStateKey];
};

StateMachine.prototype.trigger = function(event) {
  var state = this.getCurrentState();
  if (state[event]) {
    var oldState = this.currentStateKey;
    this.currentStateKey = state[event];
    this.emit(state[event], oldState, event);
  }
};

StateMachine.prototype.emit = function(to, from, event) {
  this.stateCallbacks.forEach(function(callbackCriteria, i) {
    var criteria = callbackCriteria.criteria;
    if ((!criteria.from || criteria.from == from) &&
        (!criteria.to || criteria.to == to) &&
        (!criteria.event || criteria.event == event)) {
      callbackCriteria.callback.call(this, to, from, event);
    }
  });
};

StateMachine.prototype.on = function(criteria, callback) {
  this.stateCallbacks.push({ criteria: criteria, callback: callback });
};

exports.StateMachine = StateMachine;