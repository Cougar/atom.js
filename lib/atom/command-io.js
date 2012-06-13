var net = require('net');

var transporttcp = require('./command-io/transport-tcp'),
    interactiveNS = require('./command-io/interactive'),
    commandNS = require('./command-io/command');

function CommandIO(config) {
  var self = this;
  this.transports = [];
  this.sessions = [];
  this.config = config;
  this.commands = {};


  // Create TCP transport if port is defined
  if (config.command.tcpPort) {
    self.transports.push(new transporttcp.TransportTCP(config.command.tcpPort));
  }


  // Bind event handlers to transports
  this.bindEventHandlers();


  // Initialize interactive
  this.interactive = new interactiveNS.Interactive(this);

  // Register list commands
  this.registerCommand(new commandNS.Command(this, 'listCommands', this.listCommands.bind(this)));
}

CommandIO.prototype.listCommands = function() {
  var cmds = [];
  for (var i in this.commands) {
    cmds.push(i);
  }
  return cmds;
};

// Private methods

CommandIO.prototype.bindEventHandlers = function() {
  var self = this;

  this.transports.forEach(function(transport) {
    transport.on('sessionData', self.handleSessionData.bind(self));
  });

  this.transports.forEach(function(transport) {
    transport.on('sessionStart', self.handleSessionStart.bind(self));
  });

  this.transports.forEach(function(transport) {
    transport.on('sessionEnd', self.handleSessionEnd.bind(self));
  });
};

CommandIO.prototype.constructErrorResponseString = function(code, message, id) {
  return JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: code,
      message: message
    },
    id: id
  });
};

CommandIO.prototype.constructSuccessResponseString = function(result, id) {
  return JSON.stringify({
    jsonrpc: "2.0",
    result: result,
    id: id
  });
};


CommandIO.prototype.handleSessionData = function(session, data) {
  var request = {};
  var result = false;

  // example: {"jsonrpc": "2.0", "method": "getPrompt", "params": [42, 23], "id": 1}


  // Parse json data
  try {
    request = JSON.parse(data);

    // TODO: Check that required fields are present
  } catch (exception) {
    session.send(this.constructErrorResponseString(-32700, exception.toString()));
    return;
  }


  // Check if method is registered
  if (!this.commands[request.method]) {
    session.send(this.constructErrorResponseString(-32601, 'Method not found: ' + request.method, request.id));
  }


  // Call command
  try {
    result = this.commands[request.method].call(session, request.params);
  } catch (exception) {
    session.send(this.constructErrorResponseString(-32700, exception.toString(), request.id));
    return;
  }


  // Send reply
  session.send(this.constructSuccessResponseString(result, request.id));
};

CommandIO.prototype.handleSessionStart = function(session) {
  this.sessions.push(session);
};

CommandIO.prototype.handleSessionEnd = function(session) {
  this.sessions = this.sessions.filter(function(sessionObj) {
    return !(sessionObj.transport === session.transport && sessionObj.identifier === session.identifier);
  });
};


// Public functions

CommandIO.prototype.callCommand = function(session, commandName, parameters) {
  return this.commands[commandName].call(session, parameters);
};

CommandIO.prototype.registerCommand = function(command) {
  this.commands[command.getName()] = command;
};

exports.CommandIO = CommandIO;

