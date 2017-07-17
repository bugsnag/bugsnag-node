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
        if (!obj) {
            return obj;
        }

        if (!options || !options.except || !options.alreadyCloned) {
            options = options || {};
            return Utils.cloneObject(obj, {
                except: options.except || [],
                exceptHandler: options.exceptHandler,
                alreadyCloned: options.alreadyCloned || { sources: [], results: [] }
            });
        }

        var except = options.except;
        var exceptHandler = options.exceptHandler;
        var clonedSources = options.alreadyCloned.sources;
        var clonedResults = options.alreadyCloned.results;

        var existingIdx = clonedSources.indexOf(obj);
        if (existingIdx > -1) {
            return clonedResults[existingIdx];
        }

        var copy = obj;
        var type = Utils.typeOf(obj);

        if (type === "object") {
            copy = {};
            clonedSources.push(obj);
            clonedResults.push(copy);

            Object.keys(obj).forEach(function (key) {
                var val = obj[key];
                if (!Utils.checkOwnProperty(obj, key)) {
                    return;
                }

                if (except.indexOf(key) > -1) {
                    if (exceptHandler) {
                        var replacement = exceptHandler(key, val);
                        if (replacement !== undefined) {
                            copy[key] = replacement;
                        }
                    }
                    return;
                }

                copy[key] = Utils.cloneObject(val, options);
            });
        } else if (type === "array") {
            copy = [];
            clonedSources.push(obj);
            clonedResults.push(copy);

            for (var i = 0; i < obj.length; ++i) {
                copy.push(Utils.cloneObject(obj[i], options));
            }
        }

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

    filterObject:  function(object, filters) {
        if (Utils.typeOf(object) !== "object") {
            return;
        }
        if (Utils.typeOf(filters) !== "array") {
            return;
        }

        return Utils.cloneObject(object, { except: filters, exceptHandler: Utils._filterHandler });
    },

    _filterHandler: function() {
        return '[FILTERED]';
    }
};

module.exports = Utils;
