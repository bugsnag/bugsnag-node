"use strict";

var LOG_PREFIX = "Bugsnag";

function Logger(logLevel) {
    this.logLevel = logLevel || "error";
}

Logger.prototype.info = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    try {
        if (this.logLevel === "info") {
            return console.log.apply(console, ["" + LOG_PREFIX + ": "].concat(args));
        }
    } catch (e) { }
};

Logger.prototype.warn = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    try {
        if (this.logLevel === "warn" || this.logLevel === "info") {
            return console.log.apply(console, ["" + LOG_PREFIX + ": "].concat(args));
        }
    } catch (e) { }
};

Logger.prototype.error = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    try {
        if (this.logLevel) {
            return console.log.apply(console, ["" + LOG_PREFIX + ": "].concat(args));
        }
    } catch (e) { }
};

module.exports = Logger;
