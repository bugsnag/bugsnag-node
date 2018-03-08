"use strict";

var domain = require("domain"),
    path = require("path"),
    Utils = require("./utils"),
    Logger = require("./logger"),
    Configuration = require("./configuration"),
    BugsnagError = require("./error"),
    Notification = require("./notification"),
    requestInfo = require("./request_info"),
    createSessionDelegate = require('./sessions');

// Ensure we get all stack frames from thrown errors.
Error.stackTraceLimit = Infinity;

// This function is private to the module scope, because `handledState` is not allowed to be set by the user
function notify (error, options, handledState, cb) {
    var bugsnagErrors, notification;
    if ((!error && typeof error !== "string") || error === true) {
        Configuration.logger.error("Bugsnag.notify(error…) accepts an object or a string but was called with '" + error + "'");
        options.metaData = {
            "notify() arguments": JSON.stringify([].map.call(arguments, function(arg) { return arg }), Utils.sensibleReplacer, 2)
        };
        error = new Error("[Bugsnag] Bugsnag.notify(error…) accepts an object or a string but was called with '" + error + "'");
    }
    if (!Bugsnag.shouldNotify()) {
        if (cb) {
            if (!Configuration.apiKey) {
                cb(new Error("Bugsnag has not been configured with an api key!"));
            } else {
                cb(new Error("Current release stage not permitted to send events to Bugsnag."));
            }
        }
        return;
    }
    Configuration.logger.info("Notifying Bugsnag of exception...\n" + (error && error.stack || error));
    bugsnagErrors = BugsnagError.buildErrors(error, options.errorName);
    delete options.errorName;
    notification = new Notification(bugsnagErrors, options, handledState);
    if (Configuration.sendCode === true) {
        notification.loadCode(function () {
            notification.deliver(cb, error);
        });
    } else {
        notification.deliver(cb, error);
    }
};

// Will ensure errors still logged if shouldNotify is false
function autoNotifyCallback(notifiedError, uncaughtError) {
    if (!uncaughtError) {
        uncaughtError = notifiedError.domain;
    }
    return function(error) {
        if (error) {
            var errorMsg = [];
            if (Bugsnag.shouldNotify()) {
                errorMsg.push("An error occurred notifying bugsnag.com")
                errorMsg.push("");
                errorMsg.push(error.stack);
            } else {
                if (!Configuration.apiKey) {
                    errorMsg.push("apiKey not being set prevents the following error from being sent to Bugsnag.");
                    errorMsg.push("https://docs.bugsnag.com/platforms/nodejs/other/#basic-configuration");
                } else {
                    errorMsg.push("configuration options prevent the following error from being sent to Bugsnag.");
                    errorMsg.push("https://docs.bugsnag.com/platforms/nodejs/other/configuration-options/#notifyreleasestages");
                }
                // only print caught errors at this point. uncaught errors get printed by
                // the onUncaughtError function later so this prevents duplicate logs
                if (!(Configuration.onUncaughtError && uncaughtError)) {
                  errorMsg.push("");
                  errorMsg.push(notifiedError.stack);
                }
            }
            Configuration.logger.error(errorMsg.join('\n'));
        }
        if (Configuration.onUncaughtError && uncaughtError) {
            return Configuration.onUncaughtError(notifiedError);
        }
    };
}

var unCaughtErrorHandlerAdded = false,
    unhandledRejectionHandlerAdded = false;

var Bugsnag = {};

// This allows people to directly play with metaData without knowledge of Configuration
Object.defineProperty(Bugsnag, 'metaData', {
    get: function() {
        return Configuration.metaData;
    },
    set: function(metaData) {
        Configuration.metaData = metaData;
    }
});

// This allows people to directly play with requestData without knowledge of domains
Object.defineProperty(Bugsnag, 'requestData', {
    get: function () {
        return process.domain && process.domain._bugsnagOptions;
    },

    set: function (requestData) {
        if (process.domain) {
            process.domain._bugsnagOptions = requestData;
        }
    }
});

// Register sets api key and will configure bugsnag based on options
Bugsnag.register = function(apiKey, options) {
    if (!options) {
        options = {};
    }
    Configuration.apiKey = apiKey;
    Bugsnag.configure(options);
    Configuration.logger.info("Registered with apiKey " + apiKey);
    return Bugsnag;
};

// Configure bugsnag using the provided options
Bugsnag.configure = function(options) {
    Configuration.configure(options);

    // Warns if the apiKey or release stages will prevent Bugsnag.notify working
    if (!Bugsnag.shouldNotify()) {
        Configuration.logger.warn(Configuration.apiKey ?
            "Current release stage not permitted to send events to Bugsnag." :
            "Bugsnag has not been configured with an api key!");
    }

    // If we should auto notify we also configure the uncaught exception handler, we can't do this
    // by default as it changes the way the app response by removing the default handler.
    if (Configuration.autoNotifyUncaught && !unCaughtErrorHandlerAdded) {
        unCaughtErrorHandlerAdded = true;
        Configuration.logger.info("Configuring uncaughtExceptionHandler");
        process.on("uncaughtException", function(err) {
            notify(err, {}, {
              originalSeverity: "error",
              unhandled: true,
              severityReason: { type: "unhandledException" }
            }, autoNotifyCallback(err, true));
        });
    }

    if (Configuration.autoNotifyUnhandledRejection && !unhandledRejectionHandlerAdded) {
        unhandledRejectionHandlerAdded = true;
        Configuration.logger.info("Configuring unhandledRejectionHandler");
        process.on("unhandledRejection", function(err) {
            notify(err, {}, {
              originalSeverity: "error",
              unhandled: true,
              severityReason: { type: "unhandledPromiseRejection" }
            }, autoNotifyCallback(err, true));
        });
    }

    if (Configuration.sessionTrackingEnabled || Configuration.autoCaptureSessions) {
        Bugsnag._sessionDelegate = createSessionDelegate(Configuration);
    }
};

// Only error is required and that can be a string or error object
Bugsnag.notify = function(error, options, cb) {
  if (Utils.typeOf(options) === "function") {
      cb = options;
      options = {};
  }
  if (!options) {
      options = {};
  }
  return notify(error, options, {
      originalSeverity: "warning",
      unhandled: false,
      severityReason: { type: 'handledException' }
  }, cb);
}

// The error handler express/connext middleware. Performs a notify
Bugsnag.errorHandler = function(err, req, res, next) {
    Configuration.logger.info("Handling express error: " + (err.stack || err));
    notify(err, {
        req: req,
    }, {
      originalSeverity: "error",
      unhandled: true,
      severityReason: { type: "unhandledErrorMiddleware", attributes: { framework: "Express/Connect" } }
    }, autoNotifyCallback(err));
    return next(err);
};

Bugsnag.createErrorHandler = function() {
  return Bugsnag.register.apply(Bugsnag, arguments).errorHandler;
};

// The request middleware for express/connect. Ensures next(err) is called when there is an error, and
// tracks the request for manual notifies.
Bugsnag.requestHandler = function(req, res, next) {
    var dom;
    dom = domain.create();
    dom._bugsnagOptions = {
        cleanedRequest: requestInfo(req)
    };
    dom._bugsnagSession = Bugsnag.startSession();
    dom.on('error', next);
    return dom.run(next);
};

Bugsnag.createRequestHandler = function() {
  return Bugsnag.register.apply(Bugsnag, arguments).requestHandler;
};

Bugsnag.restifySessionHandler = function(req, res, next) {
    process.domain._bugsnagSession = Bugsnag.startSession();
};

Bugsnag.restifyHandler = function(req, res, route, err) {
    notify(err, {
        req: req
    }, {
      originalSeverity: "error",
      unhandled: true,
      severityReason: { type: "unhandledErrorMiddleware", attributes: { framework: "Restify" } }
    }, autoNotifyCallback(err));
};

Bugsnag.koaSessionHandler = function(ctx) {
  ctx._bugsnagSession = Bugsnag.startSession();
};

Bugsnag.koaHandler = function(err, ctx) {
    var request;
    Configuration.logger.info("Handling koa error: " + (err.stack || err));
    request = ctx.req;
    request.protocol = ctx.request.protocol;
    request.host = ctx.request.host.split(':', 1)[0];
    return notify(err, Object.assign({
        req: request,
        session: ctx._bugsnagSession
      }, ctx.bugsnag), {
      originalSeverity: "error",
      unhandled: true,
      severityReason: { type: "unhandledErrorMiddleware", attributes: { framework: "Koa" } }
    }, autoNotifyCallback(err));
};

// Intercepts the first argument from a callback and interprets it as an error.
// if the error is not null it notifies bugsnag and doesn't call the callback
Bugsnag.intercept = function(options, cb) {
    if (Utils.typeOf(options) === "function") {
        cb = options;
        options = {};
    }
    if (!cb) {
        cb = (function() {});
    }
    if (process.domain) {
        return process.domain.intercept(cb);
    } else {
        return function() {
            var err = arguments[0];
            var args = Array.prototype.slice.call(arguments, 1);
            if (err && (err instanceof Error)) {
                return notify(err, options, {
                  originalSeverity: "warning",
                  unhandled: false,
                  severityReason: { type: "callbackErrorIntercept" }
                }, autoNotifyCallback(err));
            }
            if (cb) {
                return cb.apply(null, args);
            }
        };
    }
};

// Automatically notifies of uncaught exceptions in the callback and error
// event emitters. Returns an event emitter, you can hook into .on("error") if
// you want to.
Bugsnag.autoNotify = function(options, cb) {
    var dom;
    if (Utils.typeOf(options) === "function") {
        cb = options;
        options = {};
    }
    dom = domain.create();
    dom._bugsnagOptions = options;
    dom.on('error', function(err) {
        return notify(err, options, {
            originalSeverity: "error",
            unhandled: true,
            severityReason: { type: "unhandledException" }
        }, autoNotifyCallback(err, true));
    });
    process.nextTick(function() {
        return dom.run(cb);
    });
    return dom;
};

Bugsnag.shouldNotify = function() {
    return (Configuration.notifyReleaseStages === null || Configuration.notifyReleaseStages.indexOf(Configuration.releaseStage) !== -1) && Configuration.apiKey;
};

Bugsnag.onBeforeNotify = function (callback) {
    if (typeof callback !== "function") {
        throw new Error("must pass a callback to onBeforeNotify");
    }

    Configuration.beforeNotifyCallbacks.push(callback);
};

Bugsnag.startSession = function () {
    if (!Configuration.autoCaptureSessions) return null;
    return Bugsnag._sessionDelegate.startSession();
};

module.exports = Bugsnag;
