function BitSet(buffer) {
  this.buffer = buffer;
}

BitSet.prototype.read = function(position, length) {
  var value = 0;
  for (var i = position; i < position + length; i++) {
    value = (value << 1) | this.readBit(i);
  }
  return value;
};

BitSet.prototype.readBit = function(position) {
  return (this.buffer[Math.floor(position / 8)] & (0x00000001 << (7 - (position % 8))) ? 1 : 0);
};

exports.BitSet = BitSet;
