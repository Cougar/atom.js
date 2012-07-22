var util = require('../interface-util');

exports.unitInterface = util.createInterface(function() {
  this.metadata('voltage', function() {
    this.on('message', function(message) {
      if (message.header.commandName === 'Voltage' &&
          message.header.directionFlagName === 'From_Owner') {
        this.metadata.set('voltage', message.body.Value);
      }
    }.bind(this));
  });
});