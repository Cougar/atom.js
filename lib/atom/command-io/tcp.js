var net = require('net'),
    events = require('events'),
    util = require('util');

function TCP(port) {
  events.EventEmitter.call(this);

  var self = this;
  this.port = port;
  this.clients = [];
  
  this.start();
}
util.inherits(TCP, events.EventEmitter);

TCP.prototype.start = function() {
  var self = this;
  this.server = net.createServer(function(sock) {
    console.log('Client connected from ' + sock.remoteAddress +':'+ sock.remotePort);
    
    self.clients.push(sock);
    self.emit('connected', self, sock);
    
    sock.on('data', function(data) {
      console.log('Client at ' + sock.remoteAddress + ':' + sock.remotePort  + ' sent us data: ' + data);

      self.emit('message', self, sock, data);
    });
    
    sock.on('close', function(data) {
      self.clients = self.clients.filter(function(obj) {
        return obj != sock;
      });
      self.emit('disconnected', self, sock);
    });
  }).listen(this.port, "localhost");
  
  this.server.on("listening", function () {
    var address = self.server.address();
    console.log("CommandIO-TCP server listening " +
                address.address + ":" + address.port);
  });
};

TCP.prototype.send = function(sock, data) {
  sock.write(data);
};

exports.TCP = TCP;
 
