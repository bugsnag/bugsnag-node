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
    var packageInfo;
    try {
      packageInfo = require(packageJSONPath);
      return packageInfo.version;
    } catch (e) {
      return null;
    }
  };

  Utils.fullPath = function(unknownPath) {
    if (unknownPath.indexOf(path.sep) === 0) {
      return unknownPath;
    } else {
      return path.join(__dirname, unknownPath);
    }
  };

  Utils.cloneObject = function(obj, except) {
    var copy, key, _j, _len1, _ref1;
    if (except == null) {
      except = [];
    }
    if (!(obj && this.typeOf(obj) === "object")) {
      return obj;
    }
    copy = obj.constructor();
    _ref1 = Object.keys(obj);
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      key = _ref1[_j];
      if (obj.hasOwnProperty(key) && except.indexOf(key) === -1) {
        if (this.typeOf(obj[key]) === "object") {
          copy[key] = this.cloneObject(obj[key]);
        } else {
          copy[key] = obj[key];
        }
      }
    }
    return copy;
  };

  Utils.mergeObjects = function(dest, source) {
    var key, _j, _len1, _ref1;
    if (!(dest && this.typeOf(dest) === "object" && source && this.typeOf(source) === "object")) {
      return dest;
    }
    _ref1 = Object.keys(source);
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      key = _ref1[_j];
      if (source.hasOwnProperty(key)) {
        if (this.typeOf(source[key]) === "object" && dest[key]) {
          this.mergeObjects(dest[key], source[key]);
        } else {
          dest[key] = source[key];
        }
      }
    }
    return dest;
  };

  Utils.filterObject = function(object, filters) {
    var _this = this;
    if (this.typeOf(object) !== "object") {
      return;
    }
    if (this.typeOf(filters) !== "array") {
      return;
    }
    return Object.keys(object).forEach(function(key) {
      if (object.hasOwnProperty(key)) {
        return filters.forEach(function(filter) {
          if (key.indexOf(filter) !== -1) {
            return object[key] = "[FILTERED]";
          } else if (_this.typeOf(object[key]) === "object") {
            return _this.filterObject(object[key], filters);
          }
        });
      }
    });
  };

  return Utils;

})();
