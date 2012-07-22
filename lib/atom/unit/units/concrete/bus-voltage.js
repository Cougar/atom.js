var util = require('../../unit-util');

exports.unit = util.createUnit(function() {
  this.implement('sensorControl');
  this.implement('voltage');
});
