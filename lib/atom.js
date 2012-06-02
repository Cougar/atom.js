
var CanIO = require('./atom/can-io').CanIO;
var Monitor = require('./atom/monitor').Monitor;

var config = {
  protocolFile: './protocol.json',
  monitor: {
    port: 1201
  },
  udp: [
    {
      address: '192.168.1.250',
      port: 1100
    }
  ]
};

var canIO = new CanIO(config);

if (config.monitor)
{
  var monitor = new Monitor(config, canIO);
}


canIO.on('message', function(message) {
  console.log('Got message', message);
});
