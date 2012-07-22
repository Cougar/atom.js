var fs = require('fs'),
    path = require('path');

var dashToCamel = function(string, capitalize) {
  capitalize = arguments.length < 2 ? true : capitalize;
  var regex = capitalize ? /(?:\-|^)(\w)/g : /\-(\w)/g;
  return string.replace(regex, function(s, c) {
    return c.toUpperCase();
  });
};

var baseDir = path.join(__dirname, 'units');

var concreteDir = path.join(baseDir, 'concrete');
var units = fs.readdirSync(concreteDir);

var virtualDir = path.join(baseDir, 'virtual');
units.concat(fs.readdirSync(virtualDir));

units.map(function(filename) {
  return path.join(concreteDir, filename);
}).forEach(function(unitPath) {
  var name = dashToCamel(path.basename(unitPath, '.js'));
  exports[name] = require(unitPath).unit;
});
