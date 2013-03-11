var Bugsnag, Logger, Utils, path;

path = require("path");

Utils = require("./utils");

Error.stackTraceLimit = Infinity;

module.exports = Bugsnag = (function() {

  function Bugsnag() {}

  Bugsnag.NOTIFIER_NAME = "Bugsnag Node Notifier";

  Bugsnag.NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'));

  Bugsnag.NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node";

  Bugsnag.NOTIFICATION_HOST = "localhost:8000";

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

  Bugsnag.osVersion = null;

  Bugsnag.metaData = {};

  Bugsnag.onUncaughtException = function(err) {
    console.log(err.stack || err);
    return process.exit(1);
  };

  Bugsnag.register = function(apiKey, options) {
    if (options == null) {
      options = {};
    }
    Bugsnag.apiKey = apiKey;
    if (options.logLevel) {
      Logger.logLevel = options.logLevel;
    }
    Logger.info("Registering with apiKey " + apiKey);
    Bugsnag.releaseStage = options.releaseStage || Bugsnag.releaseStage;
    Bugsnag.appVersion = options.appVersion || Bugsnag.appVersion;
    Bugsnag.autoNotify = options.autoNotify != null ? options.autoNotify : Bugsnag.autoNotify;
    Bugsnag.useSSL = options.useSSL != null ? options.useSSL : Bugsnag.useSSL;
    Bugsnag.notifyReleaseStages = options.notifyReleaseStages || Bugsnag.notifyReleaseStages;
    if (options.projectRoot != null) {
      Bugsnag.projectRoot = fullPath(options.projectRoot);
    }
    if (options.packageJSON != null) {
      Bugsnag.appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON));
    }
    if (!Bugsnag.appVersion) {
      Bugsnag.appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename), 'package.json')) || Utils.getPackageVersion(path.join(Bugsnag.projectRoot, 'package.json'));
    }
    if (Bugsnag.autoNotify) {
      Logger.info("Configuring uncaughtExceptionHandler");
      return process.on("uncaughtException", function(err) {
        return Bugsnag.notifyException(err, function(error, response) {
          if (error) {
            console.log("Bugsnag: error notifying bugsnag.com - " + error);
          }
          if (Bugsnag.onUncaughtException) {
            return Bugsnag.onUncaughtException(err);
          }
        });
      });
    }
  };

  Bugsnag.notify = function(error) {
    var args, bugsnagError, cb, errorClass, notification, options;
    if (!Bugsnag.shouldNotify()) {
      return;
    }
    errorClass = void 0;
    options = {};
    cb = void 0;
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
    Logger.info("Notifying Bugsnag of exception...\n" + ((error != null ? error.stack : void 0) || error));
    bugsnagError = new (require("./error"))(error, errorClass);
    notification = new (require("./notification"))(bugsnagError, options);
    return notification.deliver(cb);
  };

  Bugsnag.shouldNotify = function() {
    return Bugsnag.notifyReleaseStages && Bugsnag.notifyReleaseStages.indexOf(Bugsnag.releaseStage) !== -1;
  };

  Bugsnag.handle = function(err, req, res, next) {
    Logger.info("Handling express error: " + (require("util").inspect(err, true, null, true)));
    Bugsnag.notify(err, {
      req: req
    });
    if (next) {
      return next(err);
    }
  };

  return Bugsnag;

}).call(this);

Logger = require("./logger");
