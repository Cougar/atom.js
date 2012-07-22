var util = require('../interface-util');

exports.unitInterface = util.createInterface(function() {
  this.metadata('reportInterval', function() {
    this.on('message', function(message) {
      if (message.header.commandName === 'Report_Interval' &&
          message.header.directionFlagName === 'From_Owner') {
        this.metadata.set('reportInterval', message.body.Time);
      }
    }.bind(this));
  });
  
  this.sendReportInterval = function(value) {
    this.canIO.send({
      header: {
        className: 'sns',
        moduleId: this.config.moduleId,
        moduleTypeName: this.config.type,
        directionFlagName: 'To_Owner',
        commandName: 'Report_Interval'
      },
      body: {
        Time: value
      }
    });
  };
});