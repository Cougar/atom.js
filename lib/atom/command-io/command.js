
function Command(instance, name, methodCallback) {
  this.instance = instance;
  this.methodCallback = methodCallback;
  this.argumentString = '';
  this.namespaceString = '';
  this.methodString = '';
  this.autocompleteCallback = null;
  this.helpText = '';


 // Find namespace
  var namespaceString = instance.constructor.toString();

  var posEnd = namespaceString.indexOf('(');
  var posStart = namespaceString.indexOf(' ') + 1;

  this.namespaceString = namespaceString.substr(posStart, posEnd - posStart);

  this.methodString = name;

  var commandString = methodCallback.toString();
  var match = commandString.match(/\((.*?)\)/);
  if (!match) {
    throw new Error('Could not parse command arguments');
  }

  this.argumentString = match[1].split(',').map(function(arg) {
    return '<' + arg.trim() + '>';
  }).join(' ').replace('<>', '');
}

Command.prototype.getName = function() {
  return this.namespaceString + '.' + this.methodString;
};

Command.prototype.call = function(session, parameters) {
  var callParams = [];
  callParams.push(session);

  if (parameters) {
    callParams = callParams.concat(parameters);
  }

  return this.methodCallback.apply(this.instance, callParams);
};

Command.prototype.makeInteractive = function(autocompleteCallback, helpText) {
  this.autocompleteCallback = autocompleteCallback;
  this.helpText = helpText;
};

exports.Command = Command;
