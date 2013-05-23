var Configuration, Logger, Utils, path;

path = require("path");

Logger = require("./logger");

Utils = require("./utils");

module.exports = Configuration = (function() {

  function Configuration() {}

  Configuration.filters = ["password"];

  Configuration.notifyReleaseStages = null;

  Configuration.projectRoot = path.dirname(require.main.filename);

  Configuration.autoNotifyUncaught = true;

  Configuration.useSSL = true;

  Configuration.notifyHost = "notify.bugsnag.com";

  Configuration.notifyPath = "/";

  Configuration.notifyPort = void 0;

  Configuration.apiKey = null;

  Configuration.releaseStage = process.env.NODE_ENV || "production";

  Configuration.appVersion = null;

  Configuration.metaData = {};

  Configuration.logger = new Logger();

  Configuration.onUncaughtError = function(err) {
    if ((err instanceof Error) && err.domain) {
      if (err.domainThrown || err.domainEmitter) {
        Configuration.logger.error(err.stack || err);
        return process.exit(1);
      }
    } else {
      Configuration.logger.error(err.stack || err);
      return process.exit(1);
    }
  };

  Configuration.configure = function(options) {
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
    Configuration.notifyReleaseStages = options.notifyReleaseStages || Configuration.notifyReleaseStages;
    Configuration.notifyHost = options.notifyHost || Configuration.notifyHost;
    Configuration.notifyPort = options.notifyPort || Configuration.notifyPort;
    Configuration.notifyPath = options.notifyPath || Configuration.notifyPath;
    Configuration.metaData = options.metaData || Configuration.metaData;
    Configuration.onUncaughtError = options.onUncaughtError || Configuration.onUncaughtError;
    if (options.projectRoot != null) {
      Configuration.projectRoot = Utils.fullPath(options.projectRoot);
    }
    if ((options.packageJSON != null) && !Configuration.appVersion) {
      Configuration.appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON));
    }
    if (!Configuration.appVersion) {
      return Configuration.appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename), 'package.json')) || Utils.getPackageVersion(path.join(Configuration.projectRoot, 'package.json'));
    }
  };

  return Configuration;

}).call(this);
