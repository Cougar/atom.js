var atom = require('../lib/atom');

var server = new atom.Atom({
  protocolFile: './protocol.json',
  monitor: {
    port: 1201
  },
  udp: [
    {
      address: '192.168.1.250',
      port: 1100
    }
  ],
  legacy: [
    {
      port: 1200
    }
  ]
});

server.on('error', function(error) {
  console.log('An error occured in Atom: ' + error);
});