var net = require('net'),
    events = require('events'),
    util = require('util');


var rawmessage = require('./raw-message');

function Legacy(port) {
  events.EventEmitter.call(this);

  var self = this;
  this.port = port;
  this.clients = [];

  net.createServer(function(sock) {
    console.log('Client connected from ' + sock.remoteAddress +':'+ sock.remotePort);

    self.clients.push(sock);

    sock.on('data', function(data) {
      if (data.toString().substr(0, ("quit").length) === "quit") {
        console.log('Client at ' + sock.remoteAddress +':'+ sock.remotePort + ' requested to be disconnected');
        sock.end();
      } else {
        console.log('Client at ' + sock.remoteAddress + ':' + sock.remotePort  + ' sent us data: ' + data);
        self.handleClientData(data);
      }
    });

    sock.on('close', function(data) {
      self.clients = self.clients.filter(function(obj) {
        return obj != sock;
      });
    });

  }).listen(this.port, "localhost");
}
util.inherits(Legacy, events.EventEmitter);

Legacy.prototype.handleClientData = function(msg, rinfo) {
  var line = msg.toString();
  var data = new Buffer(17) ;
  data.fill(0x00);


  // Check that the packet is long enough
  if (line.length < 16) {
    console.log('Received corrupt packet, it is to short (' + line.length + ')!');
    return;
  }


  // Construct byte buffer
  data[0] = 253; // Start byte


  var value = line.substr(4, 2);
  data[4] = parseInt(value, 16);
  //console.log('4:' + value + '==' + data[4].toString());

  value = line.substr(6, 2);
  data[3] = parseInt(value, 16);
  //console.log(value + '==' + data[3].toString());

  value = line.substr(8, 2);
  data[2] = parseInt(value, 16);
  //console.log(value + '==' + data[2].toString());

  value = line.substr(10, 2);
  data[1] = parseInt(value, 16);
  //console.log(value + '==' + data[1].toString());

  value = line.substr(13, 1);
  data[5] = parseInt(value, 16);
  //console.log(value + '==' + data[5].toString());

  value = line.substr(15, 1);
  data[6] = parseInt(value, 16);
  //console.log(value + '==' + data[6].toString());

  var length = 0;
  var index = 0;

  while (length < 8 && index + 16 < line.length) {
    value = line.substr(index + 17, 2);

    if ((!value.length) || value.indexOf('\n') != -1) {
      break;
    }

    data[8 + length] = parseInt(value, 16);
    //console.log(value + '= =' + data[8 + length].toString());

    index += 3;
    length++;
  }

  data[7] = length;

  data[16] = 250; // End byte


  // Send event
  this.emit('message', new rawmessage.RawMessage(data, this));
};

Legacy.prototype.send = function(rawMessage) {
  var message = rawMessage.data;

  // Check that we have a message
  if (message[0] != 253) {
    return;
  }


  // Encode package string
  var line = "PKT ";
  line += String('00' + (message[4]).toString(16)).slice(-2);
  line += String('00' + (message[3]).toString(16)).slice(-2);
  line += String('00' + (message[2]).toString(16)).slice(-2);
  line += String('00' + (message[1]).toString(16)).slice(-2);
  line += ' ';
  line += String('0' + (message[5]).toString(16)).slice(-1);
  line += ' ';
  line += String('0' + (message[6]).toString(16)).slice(-1);

  for (var index = 8; index < 8 + message[7]; index++) {
    line += " " + String('00' + (message[index]).toString(16)).slice(-2);
  }

  line += '\n';


  // Send string to clients
  this.clients.forEach(function(client) {
    client.write(line);
  });
};

exports.Legacy = Legacy;
