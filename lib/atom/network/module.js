function Module(node, info) {
  this.node = node;
  this.moduleId = info.moduleId;
  this.moduleTypeName = info.moduleTypeName;
}

Module.prototype.toString = function() {
  return "<Module id:" + this.moduleId + " type:" + this.moduleTypeName + ">";
};

exports.Module = Module;