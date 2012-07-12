function BitSet(buffer) {
  this.buffer = buffer;
}

BitSet.prototype.read = function(position, length) {
  var value = 0;
  for (var i = position; i < position + length; i++) {
    value = (value << 1) | this.readBit(i);
  }
  return (value >>> 0);
};

BitSet.prototype.write = function(position, length, value) {
  for (var i = position; i < position + length; i++) {
    this.writeBit(i, (value & 0x01));
    value = (value >> 1);
  }
};

BitSet.prototype.readBit = function(position) {
  return (this.buffer[Math.floor(position / 8)] & (0x00000001 << (7 - (position % 8))) ? 1 : 0);
};

BitSet.prototype.writeBit = function(position, value) {
  if (value) {
    this.buffer[Math.floor(position / 8)] |= (0x00000001 << (7 - (position % 8)));
  } else {
    this.buffer[Math.floor(position / 8)] &= ~(0x00000001 << (7 - (position % 8)));
  }
};

exports.BitSet = BitSet;
