
var commandio = require('../command-io');

function Interactive(commandIO) {
  this.commandIO = commandIO;
  
  // Register commands
  this.commandIO.registerCommand(this, promptGet, null);
  this.commandIO.registerCommand(this, promptInputCallback, null);
  this.commandIO.registerCommand(this, promptAutocompleteCallback, null);
}

// {"jsonrpc": "2.0", "method": "Interactive.promptGet", "id": 1}
function promptGet(client) {
  // Default has been overwritten
  if (client.promptGetCallback) {
    return client.promptGetCallback(client);
  }
  
  // Return default prompt
  return {
    data: "atom.js> "
  };
}

// {"jsonrpc": "2.0", "method": "Interactive.promptInputCallback", "params": [ "Atom.version" ], "id": 2}
function promptInputCallback(client, commandline) {
  // Default has been overwritten
  if (client.promptInputCallback) {
    return client.promptInputCallback(client, commandline);
  }
  console.log(commandline);
  var parts = commandline.split(" "); // TODO: Remove empty arguments

  return this.commandIO.callCommand(client, parts[0], Array.prototype.slice.call(parts, 0));
}

function promptAutocompleteCallback(client, commandline, cursorPosition) {
  // Default has been overwritten
  if (client.promptAutocompleteCallback) {
    return client.promptAutocompleteCallback(client, commandline, cursorPosition);
  }
  
  // TODO autocomplete function name if in beginning otherwise call command autocomplete
}

exports.Interactive = Interactive;

