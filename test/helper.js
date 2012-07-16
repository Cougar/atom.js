// Disable logging in tests
var log = require('winston');
log.remove(log.transports.Console);