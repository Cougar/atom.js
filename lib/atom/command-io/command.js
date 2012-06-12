
function Command(instance, methodCallback) {
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


  // Finding function name and argument list
  var commandString = methodCallback.toString();

  posEnd = commandString.indexOf('\n') - 1;
  posStart = commandString.indexOf(' ') + 1;

  var fullName = commandString.substr(posStart, posEnd - posStart);

  var posSplit = fullName.indexOf('(');
  posStart = fullName.indexOf(',', posSplit);
  posEnd = fullName.indexOf(')');

  this.methodString = fullName.substr(0, posSplit);

  if (posStart !== -1) {
    posStart++;
    this.argumentString = fullName.substr(posStart, posEnd - posStart).replace(' ', '');
  }

  if (this.argumentString.length > 0) {
    this.argumentString = this.argumentString.replace(/,/g, '');
    this.argumentString = '<' + this.argumentString.replace(/ /g, '> <') + '>';
  }
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
