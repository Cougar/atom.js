function InterfaceBuilder(callback) {
  this.metadataDef = {};
  callback.call(this);
}

InterfaceBuilder.prototype.metadata = function(name, callback) {
  this.metadataDef[name] = callback;
};

InterfaceBuilder.prototype.getCommands = function() {
  return Object.keys(this).reduce(function(acc, key) {
    if (key.substring(0, 4) === 'send') {
      acc.push(key);
    }
    return acc;
  }, []);
};

exports.createInterface = function(callback) {
  return new InterfaceBuilder(callback);
};
