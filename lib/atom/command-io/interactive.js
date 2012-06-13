
var commandio = require('../command-io'),
    commandNS = require('./command');

function Interactive(commandIO) {
  this.commandIO = commandIO;

  // Register commands
  this.commandIO.registerCommand(new commandNS.Command(this, 'promptGet', promptGet));
  this.commandIO.registerCommand(new commandNS.Command(this, 'promptHandleCommand', promptHandleCommand));
  //this.commandIO.registerCommand(new commandNS.Command(this, promptAutocompleteCallback));
}

// {"jsonrpc": "2.0", "method": "Interactive.promptGet", "id": 1}
function promptGet(session) {
  // Default has been overwritten
  if (session.promptGetCallback) {
    return session.promptGetCallback(session);
  }

  // Return default prompt
  return {
    prompt: "atom.js> "
  };
}

// {"jsonrpc": "2.0", "method": "Interactive.promptInputCallback", "params": [ "Atom.version" ], "id": 2}
// {"jsonrpc": "2.0", "method": "Atom.version", "id": 2}
function promptHandleCommand(session, commandline) {
  // Default has been overwritten
  if (session.promptInputCallback) {
    return session.promptInputCallback(session, commandline);
  }
  console.log(commandline);

  var parts = commandline.split(" "); // TODO: Remove empty arguments

  return this.commandIO.callCommand(session, parts[0], Array.prototype.slice.call(parts, 0));
}
/*
function promptAutocompleteCallback(session, commandline, cursorPosition) {
  // Default has been overwritten
  if (session.promptAutocompleteCallback) {
    return session.promptAutocompleteCallback(session, commandline, cursorPosition);
  }

  // TODO autocomplete function name if in beginning otherwise call command autocomplete
}*/

exports.Interactive = Interactive;

