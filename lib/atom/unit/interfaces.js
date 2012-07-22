var fs = require('fs'),
    path = require('path');

var dashToCamel = function(string, capitalize) {
  capitalize = arguments.length < 2 ? true : capitalize;
  var regex = capitalize ? /(?:\-|^)(\w)/g : /\-(\w)/g;
  return string.replace(regex, function(s, c) {
    return c.toUpperCase();
  });
};

var dir = path.join(__dirname, 'interfaces');
var interfaces = fs.readdirSync(dir);

interfaces.map(function(filename) {
  return path.join(dir, filename);
}).forEach(function(interfacePath) {
  var name = dashToCamel(path.basename(interfacePath, '.js'), false);
  exports[name] = require(interfacePath).unitInterface;
});
