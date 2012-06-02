var fs = require('fs');

function Protocol(protocolPath) {
  this.protocol = JSON.parse(fs.readFileSync(protocolPath));
}

Protocol.prototype.decode = function(rawMessage) {
  var buffer = rawMessage.data;
  var classId = (buffer[4] >> 1) & 0x0F;
  var className = this.lookupClassName(classId);

  if (className === 'nmt') {
    return;
  }

  var directionFlag = buffer[4] & 0x01;
  var moduleId = buffer[3];
  var commandId = buffer[1];
  var length = buffer[7];

  var canHeader = {
    className: className,
    classId: classId,
    directionFlag: directionFlag,
    moduleId: moduleId,
    commandId: commandId,
    length: length
  };

  console.log(canHeader);

  return rawMessage.toString();
};

Protocol.prototype.lookupClassName = function(classId) {
  var classes = this.protocol.root.classes.class;
  var found = classes.filter(function(cls) {
    return cls.id === classId.toString();
  });
  if (!found) {
    throw new Error('No class found for ID ' + classId);
  }
  console.log(found);
  return found[0].name;
};

Protocol.prototype.encode = function() {
  
};

exports.Protocol = Protocol;