var Bugsnag, Logger, Utils, domain, path,
  __slice = [].slice;

domain = require("domain");

path = require("path");

Utils = require("./utils");

Logger = require("./logger");

Error.stackTraceLimit = Infinity;

module.exports = Bugsnag = (function() {

  function Bugsnag() {}

  Bugsnag.filters = ["password"];

  Bugsnag.notifyReleaseStages = ["production", "development"];

  Bugsnag.projectRoot = path.dirname(require.main.filename);

  Bugsnag.autoNotifyUncaught = true;

  Bugsnag.useSSL = true;

  Bugsnag.notifyHost = "notify.bugsnag.com";

  Bugsnag.notifyPath = "/";

  Bugsnag.notifyPort = void 0;

  Bugsnag.apiKey = null;

  Bugsnag.releaseStage = process.env.NODE_ENV || "production";

  Bugsnag.appVersion = null;

  Bugsnag.osVersion = null;

  Bugsnag.metaData = {};

  Bugsnag.logger = new Logger();

  Bugsnag.onUncaughtException = function(err) {
    console.error(err.stack || err);
    return process.exit(1);
  };

  Bugsnag.register = function(apiKey, options) {
    if (options == null) {
      options = {};
    }
    Bugsnag.apiKey = apiKey;
    if (options.logLevel) {
      Bugsnag.logger.logLevel = options.logLevel;
    }
    Bugsnag.logger.info("Registering with apiKey " + apiKey);
    Bugsnag.releaseStage = options.releaseStage || Bugsnag.releaseStage;
    Bugsnag.appVersion = options.appVersion || Bugsnag.appVersion;
    Bugsnag.autoNotifyUncaught = options.autoNotify != null ? options.autoNotify : Bugsnag.autoNotifyUncaught;
    Bugsnag.useSSL = options.useSSL != null ? options.useSSL : Bugsnag.useSSL;
    Bugsnag.notifyReleaseStages = options.notifyReleaseStages || Bugsnag.notifyReleaseStages;
    Bugsnag.notifyHost = options.notifyHost || Bugsnag.notifyHost;
    Bugsnag.notifyPort = options.notifyPort || Bugsnag.notifyPort;
    Bugsnag.notifyPath = options.notifyPath || Bugsnag.notifyPath;
    Bugsnag.metaData = options.metaData || Bugsnag.metaData;
    if (options.projectRoot != null) {
      Bugsnag.projectRoot = fullPath(options.projectRoot);
    }
    if ((options.packageJSON != null) && !Bugsnag.appVersion) {
      Bugsnag.appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON));
    }
    if (!Bugsnag.appVersion) {
      Bugsnag.appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename), 'package.json')) || Utils.getPackageVersion(path.join(Bugsnag.projectRoot, 'package.json'));
    }
    if (Bugsnag.autoNotifyUncaught) {
      Bugsnag.logger.info("Configuring uncaughtExceptionHandler");
      return process.on("uncaughtException", function(err) {
        return Bugsnag.notify(err, function(error, response) {
          if (error) {
            Bugsnag.logger.error("Bugsnag: error notifying bugsnag.com - " + error);
          }
          if (Bugsnag.onUncaughtException) {
            return Bugsnag.onUncaughtException(err);
          }
        });
      });
    }
  };

  Bugsnag.notify = function(error, options, cb) {
    var bugsnagError, notification;
    if (Utils.typeOf(options) === "function") {
      cb = options;
      options = {};
    }
    options || (options = {});
    if (!Bugsnag.shouldNotify()) {
      if (cb) {
        cb();
      }
      return;
    }
    Bugsnag.logger.info("Notifying Bugsnag of exception...\n" + ((error != null ? error.stack : void 0) || error));
    bugsnagError = new (require("./error"))(error, options.errorName);
    delete options.errorName;
    notification = new (require("./notification"))(bugsnagError, options);
    return notification.deliver(cb);
  };

  Bugsnag.shouldNotify = function() {
    return Bugsnag.notifyReleaseStages && Bugsnag.notifyReleaseStages.indexOf(Bugsnag.releaseStage) !== -1 && Bugsnag.apiKey;
  };

  Bugsnag.errorHandler = function(err, req, res, next) {
    Bugsnag.logger.info("Handling express error: " + err.stack);
    Bugsnag.notify(err, {
      req: req
    });
    return next(err);
  };

  Bugsnag.requestHandler = function(req, res, next) {
    var dom;
    dom = domain.create();
    dom.on('error', function(err) {
      dom.dispose();
      return next(err);
    });
    return dom.run(next);
  };

  Bugsnag.intercept = function(cb) {
    if (!cb) {
      cb = (function() {});
    }
    if (process.domain) {
      return process.domain.intercept(cb);
    } else {
      return function() {
        var args, err;
        err = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (err) {
          return Bugsnag.notify(err);
        }
        if (cb) {
          return cb.apply(null, args);
        }
      };
    }
  };

  Bugsnag.autoNotify = function(options, cb) {
    var dom;
    if (Utils.typeOf(options) === "function") {
      cb = options;
      options = {};
    }
    dom = domain.create();
    dom.on('error', function(err) {
      dom.dispose();
      return Bugsnag.notify(err, options);
    });
    process.nextTick(function() {
      return dom.run(cb);
    });
    return dom;
  };

  return Bugsnag;

}).call(this);
