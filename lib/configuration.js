var Configuration, Logger, Utils, path;

path = require("path");

Logger = require("./logger");

Utils = require("./utils");

module.exports = Configuration = (function() {
  var _ref;

  function Configuration() {}

  Configuration.filters = ["password"];

  Configuration.notifyReleaseStages = null;

  Configuration.projectRoot = path.dirname(typeof require !== "undefined" && require !== null ? (_ref = require.main) != null ? _ref.filename : void 0 : void 0);

  Configuration.autoNotifyUncaught = true;

  Configuration.useSSL = true;

  Configuration.notifyHost = "notify.bugsnag.com";

  Configuration.notifyPath = "/";

  Configuration.notifyPort = void 0;

  Configuration.hostname = process.env.DYNO ? null : require("os").hostname();

  Configuration.apiKey = process.env.BUGSNAG_API_KEY;

  Configuration.releaseStage = process.env.NODE_ENV || "production";

  Configuration.appVersion = null;

  Configuration.metaData = {};

  Configuration.logger = new Logger();

  Configuration.onUncaughtError = function(err) {
    if ((err instanceof Error) && err.domain) {
      if (err.domainThrown || err.domainEmitter || err.domainThrown === void 0) {
        Configuration.logger.error(err.stack || err);
        return process.exit(1);
      }
    } else {
      Configuration.logger.error(err.stack || err);
      return process.exit(1);
    }
  };

  Configuration.configure = function(options) {
    var _ref1;
    if (options.logger) {
      Configuration.logger = options.logger;
    }
    if (options.logLevel) {
      Configuration.logger.logLevel = options.logLevel;
    }
    Configuration.releaseStage = options.releaseStage || Configuration.releaseStage;
    Configuration.appVersion = options.appVersion || Configuration.appVersion;
    Configuration.autoNotifyUncaught = options.autoNotify != null ? options.autoNotify : Configuration.autoNotifyUncaught;
    Configuration.useSSL = options.useSSL != null ? options.useSSL : Configuration.useSSL;
    Configuration.filters = options.filters || Configuration.filters;
    Configuration.notifyReleaseStages = options.notifyReleaseStages || Configuration.notifyReleaseStages;
    Configuration.notifyHost = options.notifyHost || Configuration.notifyHost;
    Configuration.notifyPort = options.notifyPort || Configuration.notifyPort;
    Configuration.notifyPath = options.notifyPath || Configuration.notifyPath;
    Configuration.metaData = options.metaData || Configuration.metaData;
    Configuration.onUncaughtError = options.onUncaughtError || Configuration.onUncaughtError;
    Configuration.hostname = options.hostname || Configuration.hostname;
    if (options.projectRoot != null) {
      Configuration.projectRoot = Utils.fullPath(options.projectRoot);
    }
    if ((options.packageJSON != null) && !Configuration.appVersion) {
      Configuration.appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON));
    }
    if (!Configuration.appVersion) {
      if (typeof require !== "undefined" && require !== null ? (_ref1 = require.main) != null ? _ref1.filename : void 0 : void 0) {
        Configuration.appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename), 'package.json'));
      }
      return Configuration.appVersion || (Configuration.appVersion = Utils.getPackageVersion(path.join(Configuration.projectRoot, 'package.json')));
    }
  };

  return Configuration;

}).call(this);
