
function Session(transport, identifier) {
  this.transport = transport;
  this.identifier = identifier;
}

Session.prototype.send = function(data) {
  this.identifier.write(data);
};

exports.Session = Session;
