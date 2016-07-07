var path = require("path");

var classToType = {};

var classNames = "Boolean Number String Function Array Date RegExp".split(" ");
for (var i = 0; i < classNames.length; i++) {
    var name = classNames[i];
    classToType["[object " + name + "]"] = name.toLowerCase();
}

var Utils = {

    typeOf:  function(obj) {
        if (obj === undefined || obj === null) {
            return String(obj);
        }
        var myClass = Object.prototype.toString.call(obj);
        if (myClass in classToType) {
            return classToType[myClass];
        }
        return "object";
    },

    checkOwnProperty: function (obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    },

    getPackageVersion:  function(packageJSONPath) {
        try {
            var packageInfo = require(packageJSONPath);
            return packageInfo.version;
        } catch (e) {
            return null;
        }
    },

    fullPath:  function(unknownPath) {
        return path.resolve(__dirname, unknownPath);
    },

    cloneObject:  function(obj, options) {
        if (!options) {
            options = {};
        }
        if (!(obj && Utils.typeOf(obj) === "object")) {
            return obj;
        }
        var except = options.except || [];
        var alreadyCloned = options.alreadyCloned || [];
        var copy = {};
        Object.keys(obj).forEach(function (key) {
            var val = obj[key];
            if (Utils.checkOwnProperty(obj, key) && except.indexOf(key) === -1) {
                if (Utils.typeOf(val) === "object") {
                    if (alreadyCloned.indexOf(val) === -1) {
                        alreadyCloned.push(val);
                        copy[key] = Utils.cloneObject(val, {
                            alreadyCloned: alreadyCloned
                        });
                    }
                } else {
                    copy[key] = val;
                }
            }
        });
        return copy;
    },

    mergeObjects:  function(dest, source, options) {
        if (!options) {
            options = {};
        }
        if (!(dest && Utils.typeOf(dest) === "object" && source && Utils.typeOf(source) === "object")) {
            return dest;
        }
        var alreadyMerged = options.alreadyMerged || [];

        Object.keys(source).forEach(function (key) {
            if (Utils.checkOwnProperty(source, key)) {
                var val = source[key];
                if (Utils.typeOf(val) === "object" && dest[key]) {
                    if (alreadyMerged.indexOf(val) === -1) {
                        alreadyMerged.push(val);
                        Utils.mergeObjects(dest[key], val, {
                            alreadyMerged: alreadyMerged
                        });
                    }
                } else {
                    dest[key] = source[key];
                }
            }
        });
        return dest;
    },

    filterObject:  function(object, filters, options) {
        if (!options) {
            options = {};
        }
        if (Utils.typeOf(object) !== "object") {
            return;
        }
        if (Utils.typeOf(filters) !== "array") {
            return;
        }
        object = this.cloneObject(object);
        var alreadyFiltered = options.alreadyFiltered || [];
        Object.keys(object).forEach(function (key) {
            if (Utils.checkOwnProperty(object, key)) {
                return filters.forEach(function(filter) {
                    if (key.indexOf(filter) !== -1) {
                        object[key] = "[FILTERED]";
                    } else if (Utils.typeOf(object[key]) === "object" && alreadyFiltered.indexOf(object[key]) === -1) {
                        alreadyFiltered.push(object[key]);
                        object[key] = Utils.filterObject(object[key], filters, {
                            alreadyFiltered: alreadyFiltered
                        });
                    }
                });
            }
        });
        return object;
    }
};

module.exports = Utils;
