var fs = require('fs');

var bitset = require('./bit-set'),
    rawmessage = require('./raw-message');

function Protocol(protocolPath) {
  this.protocol = JSON.parse(fs.readFileSync(protocolPath));
}

Protocol.prototype.decode = function(rawMessage) {
  var buffer = rawMessage.data;
  var header = {};
  header.classId = (buffer[4] >>> 1) & 0x0F;
  header.className = this.lookupClassName(header.classId);

  if (header.className === 'nmt') {
    header.commandId = buffer[3];
    header.commandName = this.lookupNMTCommandName(header.commandId);
  } else {
    header.moduleTypeId = buffer[3];
    header.moduleTypeName = this.lookupModuleTypeName(header.moduleTypeId);

    header.moduleId = buffer[2];

    header.commandId = buffer[1];
    header.commandName = this.lookupCommandName(header.commandId, header.moduleTypeName);

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
    variables = this.lookupNMTCommandVariables(header.commandId);
  } else {
    variables = this.lookupCommandVariables(header.commandId, header.moduleTypeName);
  }

  if (variables) {
    variables.forEach(function(variable) {
      var name = variable.name;
      var startBit = parseInt(variable.start_bit, 10);
      var bitLength = parseInt(variable.bit_length, 10);
      var type = variable.type;
      if (type === 'enum') {
        result[name] = self.decodeEnum(variable.value, bitSet, startBit, bitLength);
      } else {
        result[name] = self.decodeType(type, bitSet, startBit, bitLength);
      }
    });
  }

  return result;
};

Protocol.prototype.decodeEnum = function(values, bitSet, startBit, bitLength) {
  var value = this.decodeUint(bitSet, startBit, bitLength);
  return this.lookupAttr(values, 'name', function(val) {
    return val.id === value.toString();
  });
};

Protocol.prototype.encodeEnum = function(values, bitSet, startBit, bitLength, value) {
  var uint_value = Math.parseInt(this.lookupAttr(values, 'id', function(val) {
    return val.name === value;
  }), 10);
  this.encodeUint(bitSet, startBit, bitLength, uint_value);
};

Protocol.prototype.decodeType = function(type, bitSet, startBit, bitLength) {
  var func = 'decode' + type.charAt(0).toUpperCase() + type.slice(1);
  if (!this[func]) {
    throw new Error('No decoder for type: ' + type);
  }
  return this[func](bitSet, startBit, bitLength);
};

Protocol.prototype.encodeType = function(type, bitSet, startBit, bitLength, value) {
  var func = 'encode' + type.charAt(0).toUpperCase() + type.slice(1);
  if (!this[func]) {
    throw new Error('No encoder for type: ' + type);
  }
  return this[func](bitSet, startBit, bitLength, value);
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

Protocol.prototype.encodeInt = function(bitSet, startBit, bitLength, value) {
  var rawValue = parseInt(value, 10);
  var rawBitValue = rawValue;

  if (rawValue < 0){
    var mask = 0;

    for (var n = 0; n < bitLength; n++) {
        mask += (1 << n);
    }

    rawBitValue = (~(-rawValue)) & mask;
  }

  bitset.write(startBit, bitLength, rawBitValue);
};

Protocol.prototype.decodeUint = function(bitSet, startBit, bitLength) {
  return bitSet.read(startBit, bitLength);
};

Protocol.prototype.encodeUint = function(bitSet, startBit, bitLength, value) {
  bitSet.write(startBit, bitLength, parseInt(value, 10));
};

Protocol.prototype.decodeFloat = function(bitSet, startBit, bitLength) {
  return this.decodeInt(bitSet, startBit, bitLength) / 64.0;
};

Protocol.prototype.encodeFloat = function(bitSet, startBit, bitLength, value) {
  this.encodeInt(bitSet, startBit, bitLength, parseInt(value, 10) * 64.0);
};

Protocol.prototype.decodeAscii = function(bitSet, startBit, bitLength) {
  var value = '';
  for (var n = 0; n < bitLength; n += 8) {
    value += String.charCodeAt(bitSet.read(startBit + n, 8));
  }
  return value;
};

Protocol.prototype.encodeAscii = function(bitSet, startBit, bitLength, value) {
  for (var n = 0; n < bitLength; n += 8) {
    if (n / 8 >= value.length) {
      break;
    }

    bitset.write(startBit + n, 8, value[n / 8]);
  }
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

Protocol.prototype.encodeHexstring = function(bitSet, startBit, bitLength, value) {
  var asciiValue;

  for (var n = 0; n < bitLength; n += 4)
  {
    asciiValue = value[Math.floor(n / 4)].toUpperCase().charCodeAt(0);

    if (48 <= asciiValue && asciiValue <= 57)
    {
      bitset.write(startBit + n, 4, ascii_value - 48);
    }
    else if (65 <= asciiValue && asciiValue <= 70)
    {
      bitset.write(startBit + n, 4, asciiValue - 65);
    }
    else
    {
      throw new Error("This is not an hex string, " + value);
    }
  }
};

Protocol.prototype.lookupAttr = function(nodes, attr, callback) {
  var found = nodes.filter(function(obj) {
    return callback(obj);
  });
  if (!found[0]) {
    console.log(JSON.stringify(nodes));
    throw new Error('No node found, attr:' + attr);
  }
  return attr ? found[0][attr] : found[0];
};

Protocol.prototype.lookupClassName = function(classId) {
  return this.lookupAttr(this.protocol.root.classes['class'], 'name', function(cls) {
    return cls.id === classId.toString();
  });
};

Protocol.prototype.resolveClassId = function(className) {
  return parseInt(this.lookupAttr(this.protocol.root.classes['class'], 'id', function(cls) {
    return cls.name === className;
  }), 10);
};

Protocol.prototype.lookupDirectionFlagName = function(directionFlagId) {
  return this.lookupAttr(this.protocol.root.defines.define, 'name', function(dir) {
    return dir.id === directionFlagId.toString() && dir.group === 'DirectionFlag';
  });
};

Protocol.prototype.resolveDirectionFlagId = function(directionFlagName) {
  return parseInt(this.lookupAttr(this.protocol.root.defines.define, 'id', function(dir) {
    return dir.name === directionFlagName && dir.group === 'DirectionFlag';
  }), 10);
};

Protocol.prototype.lookupModuleTypeName = function(moduleTypeId) {
  return this.lookupAttr(this.protocol.root.modules.module, 'name', function(mod) {
    return mod.id === moduleTypeId.toString();
  });
};

Protocol.prototype.resolveModuleTypeId = function(moduleTypeName) {
  return parseInt(this.lookupAttr(this.protocol.root.modules.module, 'id', function(mod) {
    return mod.name === moduleTypeName;
  }), 10);
};

Protocol.prototype.lookupCommand = function(commandId, moduleTypeName) {
  return this.lookupAttr(this.protocol.root.commands.command, null, function(cmd) {
    return cmd.id === commandId.toString() &&
      (cmd.id < 128 || cmd.module === moduleTypeName);
  });
};

Protocol.prototype.resolveCommand = function(commandName, moduleTypeName) {
  return this.lookupAttr(this.protocol.root.commands.command, null, function(cmd) {
    return cmd.name === commandName &&
      (cmd.id < 128 || cmd.module === moduleTypeName);
  });
};

Protocol.prototype.lookupCommandName = function(commandId, moduleTypeName) {
  return this.lookupCommand(commandId, moduleTypeName).name;
};

Protocol.prototype.resolveCommandId = function(commandName, moduleTypeName) {
  return parseInt(this.resolveCommand(commandName, moduleTypeName).id, 10);
};

Protocol.prototype.lookupCommandVariables = function(commandId, moduleTypeName) {
  var command = this.lookupCommand(commandId, moduleTypeName);

  if (!command.variables.variable) {
    return [];
  }

  if (command.variables.variable instanceof Array) {
    return command.variables.variable;
  }

  return [ command.variables.variable ];
};

Protocol.prototype.lookupNMTCommand = function(commandId) {
  return this.lookupAttr(this.protocol.root.nmt_messages.nmt_message, null, function(cmd) {
    return cmd.id === commandId.toString();
  });
};

Protocol.prototype.resolveNMTCommand = function(commandName) {
  return this.lookupAttr(this.protocol.root.nmt_messages.nmt_message, null, function(cmd) {
    return cmd.name === commandName;
  });
};

Protocol.prototype.lookupNMTCommandVariables = function(commandId) {
  var command = this.lookupNMTCommand(commandId);

  if (!command.variables.variable) {
    return [];
  }

  if (command.variables.variable instanceof Array) {
    return command.variables.variable;
  }

  return [ command.variables.variable ];
};

Protocol.prototype.lookupNMTCommandName = function(commandId) {
  return this.lookupNMTCommand(commandId).name;
};

Protocol.prototype.resolveNMTCommandName = function(commandName) {
  return parseInt(this.resolveNMTCommand(commandName).id, 10);
};

Protocol.prototype.encode = function(message) {
  var self = this;
  var data = new Buffer(17) ;
  data.fill(0x00);

  message.header.classId = this.resolveClassId(message.header.className);

  data[0] = 253; // Start byte
  data[4] = message.header.classId << 1;

  if (message.header.className == "nmt") {
    message.header.commandId = this.resolveNMTCommandId(message.header.commandName);

    data[3] = message.header.commandId;
  } else {
    message.header.directionFlagId = this.resolveDirectionFlagId(message.header.directionFlagName);
    message.header.moduleTypeId = this.resolveModuleTypeId(message.header.moduleTypeName);
    message.header.moduleId = message.header.moduleId;
    message.header.commandId = this.resolveCommandId(message.header.commandName, message.header.moduleTypeName);

    data[4] |= (message.header.directionFlagId & 0x01);
    data[3] = message.header.moduleTypeId;
    data[2] = message.header.moduleId;
    data[1] = message.header.commandId;
  }

  var highestBit = 0;
  var buffer = new Buffer(8);

  buffer.fill(0x00);

  var bitSet = new bitset.BitSet(buffer);

  var variables = [];

  if (message.header.className === 'nmt') {
    variables = this.lookupNMTCommandVariables(message.header.commandId);
  } else {
    variables = this.lookupCommandVariables(message.header.commandId, message.header.moduleTypeName);
  }

  variables.forEach(function(variable) {
    var name = variable.name;
    var startBit = parseInt(variable.start_bit, 10);
    var bitLength = parseInt(variable.bit_length, 10);
    var type = variable.type;

    if (message.body[name]) {
      if (type === 'enum') {
        self.encodeEnum(variable.value, bitSet, startBit, bitLength, message.body[name]);
      } else {
        self.encodeType(type, bitSet, startBit, bitLength, message.body[name]);
      }

      if (type == "ascii") {
        bitLength = message.body[name].length * 8;
      } else if (type == "hexstring") {
        bitLength = message.body[name].length() * 4;
      }
    }

    if (highestBit < startBit + bitLength) {
      highestBit = startBit + bitLength;
    }
  });

  message.header.length = Math.min(Math.ceil(highestBit / 8.0), 8);

  data[5] = 1;
  data[6] = 0;
  data[7] = message.header.length;

  for (var n = 0; n < message.header.length; n++) {
    data[8 + n] = bitSet.buffer[n];
  }

  data[16] = 250; // End byte

  return new rawmessage.RawMessage(data, this);
};

exports.Protocol = Protocol;

