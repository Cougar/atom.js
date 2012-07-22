var util = require('../../unit-util');

exports.unit = util.createUnit(function() {
  this.implement('sensorControl');
  this.implement('voltage', ['voltage'], function() {
    this.metadata.set('voltage', 75);
  });

  /// ////////////////////////////////////////////////
  this.on('meta:voltage', function(voltage) {
    console.log('got voltage!' + voltage);
    this.sendReportInterval(3);
  }.bind(this));

  this.on('meta:reportInterval', function(interval) {
    console.log('got report interval!' + interval);
  }.bind(this));
  ////////////////////////////////////////////////////
});
