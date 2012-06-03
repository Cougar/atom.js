
var commandio = require('../command-io');

function Interactive(commandIO) {
  this.commandIO = commandIO;
  
  // Register commands
  this.commandIO.registerCommand(this, promptGet, null);
  this.commandIO.registerCommand(this, promptInputCallback, null);
  this.commandIO.registerCommand(this, promptAutocompleteCallback, null);
};


function promptGet(client) {
  // Default has been overwritten
  if (client.promptGetCallback) {
    return client.promptGetCallback(client);
  }
  
  // Return default prompt
  return {
    data: "atom.js> "
  };
};

function promptInputCallback(client, commandline) {
  // Default has been overwritten
  if (client.promptInputCallback) {
    return client.promptInputCallback(client, commandline);
  }
  
  // TODO parse commandline and call function
};

function promptAutocompleteCallback(client, commandline, cursorPosition) {
  // Default has been overwritten
  if (client.promptAutocompleteCallback) {
    return client.promptAutocompleteCallback(client, commandline, cursorPosition);
  }
  
  // TODO autocomplete function name if in beginning otherwise call command autocomplete
};

exports.Interactive = Interactive;
 
