var select = exports.select = function(units, crit) {
  var filteredUnits = units.filter(function(unit) {
    return Object.keys(crit).every(function(key) {
      return unit.metadata.get(key) === crit[key];
    });p
  });
  return new UnitSelection(filteredUnits);
};

function UnitSelection(units) {
  this.units = units;
  this.length = this.units.length;
}

UnitSelection.prototype.select = function(crit) {
  return new UnitSelection(select(this.units, crit));
};

UnitSelection.prototype.toArray = function() {
  return this.units;
};

UnitSelection.fn = {};
UnitSelection.fn.on = function(event, callback) {
  this.on(event, function() {
    callback.apply(this, [this].concat(Array.prototype.slice.call(arguments)));
  });
};

Object.keys(UnitSelection.fn).forEach(function(name) {
  UnitSelection.prototype[name] = function() {
    var fnArgs = arguments;
    this.units.forEach(function(unit) {
      UnitSelection.fn[name].apply(unit, fnArgs);
    });
  };
  return this;
});

exports.UnitSelection = UnitSelection;

