require('../../test_helper');

var protocol = require('../../../lib/atom/can-io/protocol');

describe('Protocol', function() {
  beforeEach(function() {
    this.protocol = new protocol.Protocol(__dirname + '/../../fixtures/protocol_example.json');
  });
  describe('encoding', function() {
    it('encodes a list request message correctly', function() {
      var message = {
        header: {
          directionFlagName: 'To_Owner',
          className: 'mnmt',
          commandName: 'List'
        },
        body: {
          HardwareId: parseInt('0xE4662051', 16)
        }
      };
      var rawMessage = this.protocol.encode(message);
      rawMessage.data.should.eql(new Buffer([
        0xFD, // start bit
        0x00, // command ID
        0x00, // module ID
        0x00, // module Type ID
        0x16, // class ID and direction
        0x01, // ?
        0x00, // ?
        0x04, // length
        0xE4, // hardware ID 1
        0x66, // hardware ID 2
        0x20, // hardware ID 3
        0x51, // hardware ID 4
        0x00, // unused
        0x00, // unused
        0x00, // unused
        0x00, // unused
        0xFA  // end bit
      ]));
    });
  });
});