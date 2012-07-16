require('../../test_helper.js');

var Node = require('../../../lib/atom/network/node').Node;

var module = require('../../../lib/atom/network/module');

describe('Node', function() {
  beforeEach(function() {
    this.network = {
      sent: [],
      sendCanMessage: function(message) {
        this.sent.push(message);
      }
    };
    this.node = new Node('ABC123', this.network);
  });

  describe('state handling', function() {
    it('is in offline state by default', function() {
      this.node.getState().should.eql('offline');
    });

    it('enters awaiting_list when a message is seen', function() {
      this.node.receiveCanMessage({
        header: {
          className: 'nmt',
          commandName: 'Heartbeat'
        }
      });
      this.node.getState().should.eql('awaiting_list');
    });

    it('enters online when listing complete', function() {
      this.node.stateMachine.currentStateKey = 'awaiting_list';
      this.node.receiveCanMessage({
        header: {
          directionFlagName: 'From_Owner',
          className: 'tst',
          commandName: 'List',
          moduleeId: 92,
          moduleeTypeName: 'Debug'
        },
        body: {
          NumberOfModules: 1,
          SequenceNumber: 1
        }
      });
      this.node.getState().should.eql('online');
    });
  });
  
  describe('module listing', function() {
    describe('#sendListRequest', function() {
      it('sends correct can message to ask for modules', function() {
        this.node.sendListRequest();
        this.network.sent.length.should.eql(1);
        this.network.sent[0].should.eql({
          header: {
            className: 'mnmt',
            commandName: 'List',
            directionFlagName: 'To_Owner'
          },
          body: {
           HardwareId: parseInt('0xABC123', 16)
          }
        });
      });
    });

    describe('#handleListResponse', function() {
      beforeEach(function() {
        this.node.stateMachine.currentStateKey = 'awaiting_list';
      });
      var sendListResponse = function() {
        this.node.handleListResponse({
          header: {
            moduleTypeName: 'Debug',
            moduleId: 57
          },
          body: {
            SequenceNumber: 1,
            NumberOfModules: 2
          }
        });
        
        this.node.handleListResponse({
          header: {
            moduleTypeName: 'Debug',
            moduleId: 56
          },
          body: {
            SequenceNumber: 2,
            NumberOfModules: 2
          }
        });
      };
      
      it('saves module information', function() {
        sendListResponse.call(this);
        this.node.modules.length.should.eql(2);
      });

      it('triggers list_done', function(done) {
        this.node.stateMachine.on({ event: 'list_done' }, function() {
          done();
        });
        sendListResponse.call(this);
      });

      it('emits new modules', function(done) {
        this.node.on('module.connect', function(module) {
          module.moduleTypeName.should.eql('Debug');
          if (module.moduleId === 56) {
            done();            
          }
        });
        sendListResponse.call(this);
      });
    });
  });
});