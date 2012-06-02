var net = require('net');


function Monitor(config, canIO) {

  var self = this;
  this.config = config;
  this.clients = [];
  
  this.start();
  
  canIO.on('message', function(message) {
    self.handleCanData(message);
  });
}

Monitor.prototype.start = function() {
  var self = this;
  net.createServer(function(sock) {
    console.log('Client connected from ' + sock.remoteAddress +':'+ sock.remotePort);
    
    self.clients.push(sock);
    
    sock.on('data', function(data) {
      if (data.toString().substr(0, ("quit").length) === "quit") {
        console.log('Client at ' + sock.remoteAddress +':'+ sock.remotePort + ' requested to be disconnected');
        sock.end();
      } else {
        console.log('Client at ' + sock.remoteAddress + ':' + sock.remotePort  + ' sent us data: ' + data);
      }
    });
    
    sock.on('close', function(data) {
      self.clients = self.clients.filter(function(obj) {
        return obj != sock;
      });
    });
      
  }).listen(this.config.monitor.port, "localhost");
};

Monitor.prototype.handleCanData = function(message) {
  var line = "";
  
  if (message.header.className == "nmt") {
    line += "NMT";
  } else {
    if (message.header.directionFlagName == "To_Owner") {
      line += "RX ";
    } else if (message.header.directionFlagName == "From_Owner") {
      line += "TX ";
    } else {
      line += "??";
    }
  }
        
  line += " " + message.header.commandName + " ";
        
  while (line.length < 20) {
    line += " ";
  }
        
  if (message.header.className == "nmt") {
    line += "-";
  } else {
    line += message.header.className;
    line += "_" + message.header.moduleTypeName;
    line += ":" + message.header.moduleId;
  }
      
  while (line.length < 40) {
    line += " ";
  }
  
  for (var name in message.body) {
    line += " " + name + "=" + message.body[name];
  }
        
  line += "\n";
  
  this.clients.forEach(function(client) {
    client.write(line);
  });
};

exports.Monitor = Monitor;

