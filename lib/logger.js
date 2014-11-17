var Logger,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

module.exports = Logger = (function() {
  var LOG_PREFIX;

  LOG_PREFIX = "Bugsnag";

  function Logger(logLevel) {
    this.logLevel = logLevel != null ? logLevel : "error";
    this.error = __bind(this.error, this);
    this.warn = __bind(this.warn, this);
    this.info = __bind(this.info, this);
  }

  Logger.prototype.info = function() {
    var e, output;
    output = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    try {
      if (this.logLevel === "info") {
        return console.log.apply(console, ["" + LOG_PREFIX + ": "].concat(__slice.call(output)));
      }
    } catch (_error) {
      e = _error;
    }
  };

  Logger.prototype.warn = function() {
    var e, output;
    output = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    try {
      if (this.logLevel === "warn" || this.logLevel === "info") {
        return console.log.apply(console, ["" + LOG_PREFIX + ": "].concat(__slice.call(output)));
      }
    } catch (_error) {
      e = _error;
    }
  };

  Logger.prototype.error = function() {
    var e, output;
    output = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    try {
      if (this.logLevel != null) {
        return console.error.apply(console, ["" + LOG_PREFIX + ": "].concat(__slice.call(output)));
      }
    } catch (_error) {
      e = _error;
    }
  };

  return Logger;

})();
