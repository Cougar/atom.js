function Module(node, info) {
  this.node = node;
  this.moduleId = info.moduleId;
  this.moduleTypeName = info.moduleTypeName;
}

Module.prototype.toString = function() {
  return "<Module id:" + this.moduleId + " type:" + this.moduleTypeName + ">";
};

Module.prototype.toJSON = function() {
  return {
    moduleId: this.moduleId,
    moduleTypeName: this.moduleTypeName
  };
};

exports.Module = Module;