var Logger,
  __slice = [].slice;

module.exports = Logger = (function() {

  function Logger() {}

  Logger.LOG_PREFIX = "Bugsnag";

  Logger.logLevel = "error";

  Logger.info = function() {
    var output;
    output = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (this.logLevel === "info") {
      return console.log.apply(console, ["" + this.LOG_PREFIX + ": "].concat(__slice.call(output)));
    }
  };

  Logger.warn = function() {
    var output;
    output = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (this.logLevel === "warn" || this.logLevel === "log") {
      return console.log.apply(console, ["" + this.LOG_PREFIX + ": "].concat(__slice.call(output)));
    }
  };

  Logger.error = function() {
    var output;
    output = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (this.logLevel != null) {
      return console.error.apply(console, ["" + this.LOG_PREFIX + ": "].concat(__slice.call(output)));
    }
  };

  return Logger;

})();
