var fs = require('fs');

var bitset = require('./bit-set');

function Protocol(protocolPath) {
  this.protocol = JSON.parse(fs.readFileSync(protocolPath));
}

Protocol.prototype.decode = function(rawMessage) {
  var buffer = rawMessage.data;
  var header = {};
  header.classId = (buffer[4] >> 1) & 0x0F;
  header.className = this.lookupClassName(header.classId);

  if (header.className === 'nmt') {
    header.commandId = buffer[3];
    header.commandName = this.lookupNMTCommandName(header.commandId);
  } else {
    header.moduleId = buffer[3];
    header.moduleName = this.lookupModuleName(header.moduleId);

    header.commandId = buffer[1];
    header.commandName = this.lookupCommandName(header.commandId, header.moduleName);

    header.directionFlagId = buffer[4] & 0x01;
    header.directionFlagName = this.lookupDirectionFlagName(header.directionFlagId);
  }
  
  header.length = buffer[7];

  var body = this.decodeBody(buffer, header);


  return {
    header: header,
    body: body
  };
};

Protocol.prototype.decodeBody = function(buffer, header) {
  var bitSet = new bitset.BitSet(buffer.slice(8));
  var result = {};
  var self = this;
  var variables = [];
  
  if (header.className === 'nmt') {
    variables = this.lookupNMTCommandVariables(header.commandId, header.moduleName);
  } else {
    variables = this.lookupCommandVariables(header.commandId, header.moduleName);
  }

  variables.forEach(function(variable) {
    var name = variable.name;
    var startBit = parseInt(variable.start_bit);
    var bitLength = parseInt(variable.bit_length);
    var type = variable.type;
    if (type === 'enum') {
      result[name] = self.decodeEnum(variable.value, bitSet, startBit, bitLength);
    } else {
      result[name] = self.decodeType(type, bitSet, startBit, bitLength);
    }
  });
  return result;
};

Protocol.prototype.decodeEnum = function(values, bitSet, startBit, bitLength) {
  var value = this.decodeUint(bitSet, startBit, bitLength);
  return this.lookupAttr(values, 'name', function(val) {
    return val.id === value.toString();
  });
};
Protocol.prototype.decodeType = function(type, bitSet, startBit, bitLength) {
  var func = 'decode' + type.charAt(0).toUpperCase() + type.slice(1);
  if (!this[func]) {
    throw new Error('No decoder for type: ' + type);
  }
  return this[func](bitSet, startBit, bitLength);
};

Protocol.prototype.decodeInt = function(bitSet, startBit, bitLength) {
  var sign = bitSet.readBit(startBit);
  var rawBitValue = bitSet.read(startBit, bitLength);
  var rawValue = rawBitValue;
  
  if (sign) {
    var mask = 0;
    for (var n = 0; n < bitLength; n++) {
      // TODO: This fails for n large?
      mask += (1 << n);
    }
    rawValue = -((~rawBitValue) & mask);
  }
  return rawValue;
};

Protocol.prototype.decodeUint = function(bitSet, startBit, bitLength) {
    return bitSet.read(startBit, bitLength);
};

Protocol.prototype.decodeFloat = function(bitSet, startBit, bitLength) {
  return this.decodeInt(bitSet, startBit, bitLength) / 64.0;
};

Protocol.prototype.decodeAscii = function(bitSet, startBit, bitLength) {
  var value = '';
  for (var n = 0; n < bitLength; n += 8) {
    value += String.charCodeAt(bitSet.read(startBit + n, 8));
  }
  return value;
};

Protocol.prototype.decodeHexstring = function(bitSet, startBit, bitLength) {
  var value = '';
  var hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
  var len = hex.length;
  
  for (var n = 0; n < bitLength; n += 4) {
    var rawBitValue = bitSet.read(startBit + n, 4);
    
    if (rawBitValue >= len) {
      value += '-';
    } else {
      value += hex[rawBitValue];
    }
  }
  return value;
};

Protocol.prototype.lookupAttr = function(nodes, attr, callback) {
  var found = nodes.filter(function(obj) {
    return callback(obj);
  });
  if (!found[0]) {
    throw new Error('No node found');
  }
  return attr ? found[0][attr] : found[0];
};

Protocol.prototype.lookupClassName = function(classId) {
  return this.lookupAttr(this.protocol.root.classes.class, 'name', function(cls) {
    return cls.id === classId.toString();
  });
};

Protocol.prototype.lookupDirectionFlagName = function(directionFlagId) {
  return this.lookupAttr(this.protocol.root.defines.define, 'name', function(dir) {
    return dir.id === directionFlagId.toString() && dir.group === 'DirectionFlag';
  });
};

Protocol.prototype.lookupModuleName = function(moduleId) {
  return this.lookupAttr(this.protocol.root.modules.module, 'name', function(mod) {
    return mod.id === moduleId.toString();
  });
};

Protocol.prototype.lookupCommand = function(commandId, moduleName) {
  return this.lookupAttr(this.protocol.root.commands.command, null, function(cmd) {
    return cmd.id === commandId.toString() &&
      (cmd.id < 128 || cmd.module === moduleName);
  });
};

Protocol.prototype.lookupCommandName = function(commandId, moduleName) {
  return this.lookupCommand(commandId, moduleName).name;
};

Protocol.prototype.lookupCommandVariables = function(commandId, moduleName) {
  var command = this.lookupCommand(commandId, moduleName);
  return command.variables.variable;
};

Protocol.prototype.lookupNMTCommand = function(commandId) {
  return this.lookupAttr(this.protocol.root.nmt_messages.nmt_message, null, function(cmd) {
    return cmd.id === commandId.toString();
  });
};

Protocol.prototype.lookupNMTCommandVariables = function(commandId) {
  var command = this.lookupNMTCommand(commandId);
  return command.variables.variable;
};

Protocol.prototype.lookupNMTCommandName = function(commandId) {
  return this.lookupNMTCommand(commandId).name;
};

Protocol.prototype.encode = function() {
  
};

exports.Protocol = Protocol;

