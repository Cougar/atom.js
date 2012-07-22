function InterfaceBuilder(callback) {
  this.commandsDef = {};
  this.metadataDef = {};
  callback.call(this);
}

InterfaceBuilder.prototype.metadata = function(name, callback) {
  this.metadataDef[name] = callback;
};

InterfaceBuilder.prototype.command = function(name, callback) {
  this.commandsDef[name] = callback;
};

exports.createInterface = function(callback) {
  return new InterfaceBuilder(callback);
};
