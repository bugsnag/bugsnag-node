var Utils, classToType, name, path, _i, _len, _ref;

path = require("path");

classToType = {};

_ref = "Boolean Number String Function Array Date RegExp".split(" ");
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  name = _ref[_i];
  classToType["[object " + name + "]"] = name.toLowerCase();
}

module.exports = Utils = (function() {
  function Utils() {}

  Utils.typeOf = function(obj) {
    var myClass;
    if (obj === void 0 || obj === null) {
      return String(obj);
    }
    myClass = Object.prototype.toString.call(obj);
    if (myClass in classToType) {
      return classToType[myClass];
    }
    return "object";
  };

  Utils.getPackageVersion = function(packageJSONPath) {
    var e, packageInfo;
    try {
      packageInfo = require(packageJSONPath);
      return packageInfo.version;
    } catch (_error) {
      e = _error;
      return null;
    }
  };

  Utils.fullPath = function(unknownPath) {
    return path.resolve(__dirname, unknownPath);
  };

  Utils.cloneObject = function(obj, options) {
    var alreadyCloned, copy, except, key, val, _j, _len1, _ref1;
    if (options == null) {
      options = {};
    }
    if (!(obj && this.typeOf(obj) === "object")) {
      return obj;
    }
    except = options.except || [];
    alreadyCloned = options.alreadyCloned || [];
    copy = obj.constructor();
    _ref1 = Object.keys(obj);
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      key = _ref1[_j];
      val = obj[key];
      if (obj.hasOwnProperty(key) && except.indexOf(key) === -1) {
        if (this.typeOf(val) === "object") {
          if (alreadyCloned.indexOf(val) === -1) {
            alreadyCloned.push(val);
            copy[key] = this.cloneObject(val, {
              alreadyCloned: alreadyCloned
            });
          }
        } else {
          copy[key] = val;
        }
      }
    }
    return copy;
  };

  Utils.mergeObjects = function(dest, source, options) {
    var alreadyMerged, key, val, _j, _len1, _ref1;
    if (options == null) {
      options = {};
    }
    if (!(dest && this.typeOf(dest) === "object" && source && this.typeOf(source) === "object")) {
      return dest;
    }
    alreadyMerged = options.alreadyMerged || [];
    _ref1 = Object.keys(source);
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      key = _ref1[_j];
      if (source.hasOwnProperty(key)) {
        val = source[key];
        if (this.typeOf(val) === "object" && dest[key]) {
          if (alreadyMerged.indexOf(val) === -1) {
            alreadyMerged.push(val);
            this.mergeObjects(dest[key], val, {
              alreadyMerged: alreadyMerged
            });
          }
        } else {
          dest[key] = source[key];
        }
      }
    }
    return dest;
  };

  Utils.filterObject = function(object, filters, options) {
    var alreadyFiltered;
    if (options == null) {
      options = {};
    }
    if (this.typeOf(object) !== "object") {
      return;
    }
    if (this.typeOf(filters) !== "array") {
      return;
    }
    alreadyFiltered = options.alreadyFiltered || [];
    return Object.keys(object).forEach((function(_this) {
      return function(key) {
        if (object.hasOwnProperty(key)) {
          return filters.forEach(function(filter) {
            if (key.indexOf(filter) !== -1) {
              return object[key] = "[FILTERED]";
            } else if (_this.typeOf(object[key]) === "object" && alreadyFiltered.indexOf(object[key]) === -1) {
              alreadyFiltered.push(object[key]);
              return _this.filterObject(object[key], filters, {
                alreadyFiltered: alreadyFiltered
              });
            }
          });
        }
      };
    })(this));
  };

  return Utils;

})();
