
var CanIO = require('./atom/can-io').CanIO;

console.log(CanIO);

var canIO = new CanIO({
  protocolFile: './protocol.json',
  udp: [
    {
      address: '192.168.1.250',
      port: 1100
    }
  ]
});
canIO.on('message', function() {
  console.log('CANIO GOT MESSAGE!!!!!!!!!!1');
});  
