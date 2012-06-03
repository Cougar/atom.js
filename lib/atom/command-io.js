var net = require('net');

var tcp = require('./command-io/tcp'),
    commands = require('./command-io/commands'),
    interactive = require('./command-io/interactive');

function CommandIO(config) {

  var self = this;
  this.ios = [];
  this.clients = [];
  this.config = config;
  this.commands = {};

  // Create TCP IO
  if (config.command.tcpPort) {
    self.ios.push(self.createTCP(config));
  }
  
  // Bind IOs
  this.bindIOs();
  
  // Initialize interactive
  this.interactive = new interactive.Interactive(this);
}

CommandIO.prototype.createTCP = function(config) {
  return new tcp.TCP(config.command.tcpPort);
};

CommandIO.prototype.bindIOs = function() {
  var self = this;
  this.ios.forEach(function(io) {
    io.on('message', self.handleIOMessage.bind(self));
  });
  this.ios.forEach(function(io) {
    io.on('connected', self.handleIOConnected.bind(self));
  });
  this.ios.forEach(function(io) {
    io.on('disconnected', self.handleIODisconnected.bind(self));
  });
};

CommandIO.prototype.findClient = function(io, client) {
  var matchedClients = this.clients.filter(function(obj) {
    return obj.io === io && obj.client === client;
  });
  
  if (matchedClients.length == 0) {
    return null;
  }
  
  return matchedClients[0];
};

CommandIO.prototype.handleIOMessage = function(io, client, data) {
  var command = {};
  var result = false;

  // example: {"jsonrpc": "2.0", "method": "getPrompt", "params": [42, 23], "id": 1}
  
  // Parse json data
  try {
    command = JSON.parse(data);
  } catch (err) {
    io.send(client, JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: "Parse error: " + err
      },
      id: null
    }));
    return;
  }

  // Check if method is registered
  if (!command.method || !this.commands[command.method]) {
    io.send(client, JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: "Method not found: " + command.method
      },
      id: command.id
    }));
    return;
  }
  
  // Find client
  var storedClient = this.findClient(io, client);
  
  if (!storedClient) {
    io.send(client, JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message: "Failed to find client: " + command.method
      },
      id: command.id
    }));
    return;
  }
  
  // Construct parameters
  var parameters = [];
  parameters.push(storedClient);

  if (command.params) {
    parameters.concat(command.params);
  }
  
  // Call command
  result = this.commands[command.method].command.apply(this.commands[command.method].self, parameters);
    
  // Reply
  io.send(client, JSON.stringify({
    jsonrpc: "2.0",
    result: result,
    id: command.id
  }));
};

CommandIO.prototype.handleIOConnected = function(io, client) {
  this.clients.push({
    io: io,
    client: client,
    promptGetCallback: null,
    promptInputCallback: null,
    promptAutocompleteCallback: null,
  });
};

CommandIO.prototype.handleIODisconnected = function(io, client) {
  this.clients = this.clients.filter(function(obj) {
    return !(obj.io === io && obj.client === client);
  });
};


// Public functions

CommandIO.prototype.registerCommand = function(mySelf, commandCallback, autocompleteCallback, helpText) {
  // Find namespace
  var namespaceString = mySelf.constructor.toString();
  
  var posEnd = namespaceString.indexOf("(");
  var posStart = namespaceString.indexOf(" ") + 1;
  
  var namespace = namespaceString.substr(posStart, posEnd - posStart);

  // Finding function name and argument list
  var commandString = commandCallback.toString();

  var posEnd = commandString.indexOf("\n") - 1;
  var posStart = commandString.indexOf(" ") + 1;
	
  var fullName = commandString.substr(posStart, posEnd - posStart);
	
  var posSplit = fullName.indexOf("(");
  var argStart = fullName.indexOf(",", posSplit);
  var argEnd = fullName.indexOf(")");
	
  var name = fullName.substr(0, posSplit);

  var argumentsString = "";

  if (argStart !== -1) {
    argStart++;
    argumentsString = fullName.substr(argStart, argEnd - argStart).replace(' ', '');
  }
	
  if (argumentsString.length > 0) {
    argumentsString = argumentsString.replace(/,/g, "");
    argumentsString = "<" + argumentsString.replace(/ /g, "> <") + ">";
  }
	
	// Store the command
	this.commands[namespace + '.' + name] = {
	  self: mySelf,
	  commandCallback: commandCallback,
	  autocompleteCallback: autocompleteCallback,
	  argumentsString: argumentsString,
	  helpText: helpText
  };
};

CommandIO.prototype.setPrompt = function(client, promptGetCallback, promptInputCallback, promptAutocompleteCallback) {
   // Find client
  var storedClient = this.findClient(client.io, client.client);
  
  if (!storedClient) {
    return false;
  }
  
	storedClient.promptGetCallback = promptGetCallback;
	storedClient.promptInputCallback = promptInputCallback;
	storedClient.promptAutocompleteCallback = promptAutocompleteCallback;
};

CommandIO.prototype.resetPrompt = function(client) {
   // Find client
  var storedClient = this.findClient(client.io, client.client);
  
  if (!storedClient) {
    return false;
  }
  
	storedClient.promptGetCallback = null;
	storedClient.promptInputCallback = null;
	storedClient.promptAutocompleteCallback = null;
};


exports.CommandIO = CommandIO;
 
