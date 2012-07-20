var net = require('net'),
    events = require('events'),
    util = require('util');

var log = require('../logging'),
    sessionClass = require('./session');

function TransportTCP(port) {
  events.EventEmitter.call(this);

  var self = this;
  this.port = port;


  // Create server
  this.server = net.createServer(self.handleNewConnection.bind(self));


  // Print out when server is running
  this.server.on('listening', function () {
    var address = self.server.address();
    log.info('TransportTCP is now listening for clients on ' + address.address + ':' + address.port);
  });


  // Error handling
  this.server.on('error', function(error) {
    if (error.code == 'EADDRINUSE') {
      log.info('TransportTCP port (' + self.port + ') in use, retrying...');

      setTimeout(function () {
        self.server.close();
        self.server.listen(self.port);
      }, 1000);
    }
  });


  // Start to listen for incomming connections
  this.server.listen(this.port);
}
util.inherits(TransportTCP, events.EventEmitter);


// Private methods

TransportTCP.prototype.handleNewConnection = function(identifier) {
  var self = this;

  log.info('TransportTCP: Client connected from ' + identifier.remoteAddress +':'+ identifier.remotePort);

  // Create a new session object for client
  var session = new sessionClass.Session(this, identifier);


  // Bind data handler to client
  identifier.on('data', function(data) {
    self.emit('sessionData', session, data);
  });


  // Bind disconnect handler to client
  identifier.on('close', function() {
    self.emit('sessionEnd', session);
  });


  // Emit session start event
  this.emit('sessionStart', session);
};


exports.TransportTCP = TransportTCP;

