var fs = require('fs'),
    path = require('path');

var log = require('../logging'),
    units = require('./units'),
    selection = require('./selection');

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
    var moduleId = message.header.moduleId,
        moduleTypeName = message.header.moduleTypeName;
    if (moduleId) {
      this.units.forEach(function(unit) {
        if (unit.metadata.get('moduleId') === moduleId &&
            unit.metadata.get('type') === moduleTypeName) {
          unit.emit('message', message);
        }
      });
    }
  }.bind(this));

  log.info('Unit Manager started (' + this.units.length + ' units)');
};

Manager.prototype.selector = function(crit) {
  return selection.select(this.units, crit);
};

exports.Manager = Manager;