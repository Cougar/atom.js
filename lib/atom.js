var CanIO = require('./atom/can-io').CanIO;

console.log(CanIO);

var canIO = new CanIO();
canIO.start();