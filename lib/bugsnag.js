var Bugsnag, Logger, Utils, path;

path = require("path");

Utils = require("./utils");

Error.stackTraceLimit = Infinity;

module.exports = Bugsnag = (function() {
  var notifyError;

  function Bugsnag() {}

  Bugsnag.NOTIFIER_NAME = "Bugsnag Node Notifier";

  Bugsnag.NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'));

  Bugsnag.NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node";

  Bugsnag.NOTIFICATION_HOST = "notify.bugsnag.com";

  Bugsnag.NOTIFICATION_PATH = '/';

  Bugsnag.filters = ["password"];

  Bugsnag.notifyReleaseStages = ["production", "development"];

  Bugsnag.projectRoot = path.dirname(require.main.filename);

  Bugsnag.autoNotify = true;

  Bugsnag.useSSL = true;

  Bugsnag.apiKey = null;

  Bugsnag.userId = null;

  Bugsnag.context = null;

  Bugsnag.releaseStage = process.env.NODE_ENV || "production";

  Bugsnag.appVersion = null;

  Bugsnag.metaData = {};

  Bugsnag.onUncaughtException = function(err) {
    console.log(err.stack || err);
    return process.exit(1);
  };

  Bugsnag.register = function(apiKey, options) {
    var _this = this;
    if (options == null) {
      options = {};
    }
    this.apiKey = apiKey;
    if (options.logLevel) {
      Logger.logLevel = options.logLevel;
    }
    Logger.info("Registering with apiKey " + apiKey);
    this.releaseStage = options.releaseStage || this.releaseStage;
    this.appVersion = options.appVersion || this.appVersion;
    this.autoNotify = options.autoNotify != null ? options.autoNotify : this.autoNotify;
    this.autoNotify = options.useSSL != null ? options.useSSL : this.useSSL;
    this.notifyReleaseStages = options.notifyReleaseStages || this.notifyReleaseStages;
    if (options.projectRoot != null) {
      this.projectRoot = fullPath(options.projectRoot);
    }
    if (options.packageJSON != null) {
      this.appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON));
    }
    if (!this.appVersion) {
      this.appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename), 'package.json')) || Utils.getPackageVersion(path.join(projectRoot, 'package.json'));
    }
    if (this.autoNotify) {
      Logger.info("Configuring uncaughtExceptionHandler");
      return process.on("uncaughtException", function(err) {
        return _this.notifyException(err, function(error, response) {
          if (error) {
            console.log("Bugsnag: error notifying bugsnag.com - " + error);
          }
          return _this.onUncaughtException(err);
        });
      });
    }
  };

  Bugsnag.notifyException = function(error, errorClass, options, cb) {
    var args;
    if (!this.shouldNotify) {
      return;
    }
    Logger.info("Notifying Bugsnag of exception...\n" + ((error != null ? error.stack : void 0) || error));
    args = Array.prototype.slice.call(arguments);
    args.slice(1).forEach(function(argument) {
      switch (Utils.typeOf(argument)) {
        case "string":
          return errorClass = argument;
        case "object":
          return options = argument;
        case "function":
          return cb = argument;
      }
    });
    options || (options = {});
    return notifyError(new (require("./error"))(error, errorClass), options, cb);
  };

  Bugsnag.notify = function(errorClass, errorMessage, options, cb) {
    var args;
    if (!this.shouldNotify) {
      return;
    }
    Logger.info("Notifying Bugsnag of exception...\n" + errorClass + ": " + errorMessage);
    args = Array.prototype.slice.call(arguments);
    args.slice(2).forEach(function(argument) {
      switch (Utils.typeOf(argument)) {
        case "object":
          return options = argument;
        case "function":
          return cb = argument;
      }
    });
    options || (options = {});
    return notifyError(new (require("./error"))(errorMessage, errorClass), cb);
  };

  notifyError = function(bugsnagError, options, cb) {
    var notification;
    notification = new (require("./notification"))(bugsnagError, options);
    return notification.deliver(cb);
  };

  Bugsnag.shouldNotify = function() {
    return this.notifyReleaseStages && this.notifyReleaseStages.indexOf(this.releaseStage) === -1;
  };

  return Bugsnag;

})();

Logger = require("./logger");
