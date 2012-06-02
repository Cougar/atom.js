
var CanIO = require('./atom/can-io').CanIO;

var canIO = new CanIO({
  protocolFile: './protocol.json',
  udp: [
    {
      address: '192.168.1.250',
      port: 1100
    }
  ]
});
canIO.on('message', function(message) {
  console.log('Got message', message);
});  
