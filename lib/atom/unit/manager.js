var fs = require('fs'),
    path = require('path');

var units = require('./units');

function Manager(canIO, network, config) {
  this.canIO = canIO;
  this.network = network;
  this.config = JSON.parse(fs.readFileSync(path.join(__dirname, '/../../..', config.unitConfigFile)));
  this.units = [];

  this.start();
}

Manager.prototype.start = function() {
  this.config.units.forEach(function(unitConfig) {
    var unit = units[unitConfig.type](unitConfig, this.canIO);
    this.units.push(unit);
  }.bind(this));

  this.canIO.on('message', function(message) {
    var moduleId = message.header.moduleId;
    if (moduleId) {
      this.units.forEach(function(unit) {
        if (unit.metadata.get('moduleId') === moduleId) {
          unit.emit('message', message);
        }
      });
    }
  }.bind(this));
};

exports.Manager = Manager;