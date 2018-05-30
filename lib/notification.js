"use strict";

var Promise = require('promise'),
    Utils = require("./utils"),
    Logger = require("./logger"),
    Configuration = require("./configuration"),
    requestInfo = require("./request_info"),
    path = require("path"),
    request = require("request"),
    stringify = require("json-stringify-safe"),
    notifier = require("./notifier"),
    Session = require("./sessions/session");

var SUPPORTED_SEVERITIES = ["error", "warning", "info"];

function Notification(bugsnagErrors, options, handledState) {
    if (!options) {
        options = {};
    }
    var event = {
        exceptions: bugsnagErrors,
        metaData: {},
    };

    var domainOptions = Utils.cloneObject(process.domain && process.domain._bugsnagOptions || {});

    if (options.userId || domainOptions.userId) {
        event.user = event.user || {}
        event.user.id = options.userId || domainOptions.userId;
        delete options.userId;
        delete domainOptions.userId;
    }

    if (options.user || domainOptions.user) {
        event.user = options.user || domainOptions.user;
        delete options.user;
        delete domainOptions.user;
    }

    if (options.context || domainOptions.context) {
        event.context = options.context || domainOptions.context;
        delete options.context;
        delete domainOptions.context;
    }

    if (options.groupingHash || domainOptions.groupingHash) {
        event.groupingHash = options.groupingHash || domainOptions.groupingHash;
        delete options.groupingHash;
        delete domainOptions.groupingHash;
    }

    if (Configuration.appVersion) {
        if (!event.app) event.app = {};
        event.app.version = Configuration.appVersion;
    }

    if (Configuration.appType) {
        if (!event.app) event.app = {};
        event.app.type = Configuration.appType;
    }

    if (Configuration.releaseStage) {
        if (!event.app) event.app = {};
        event.app.releaseStage = Configuration.releaseStage;
    }

    // severity and handledState
    if (options.severity) event.severity = options.severity;
    this.handledState = handledState;

    if (Configuration.metaData && Object.keys(Configuration.metaData).length > 0) {
        event.metaData = Utils.cloneObject(Configuration.metaData);
    }

    if (Configuration.hostname) {
        event.device = {
            hostname: Configuration.hostname
        };
    }

    if (options.req) {
        this.processRequest(event, requestInfo(options.req));
        delete options.req;
    } else if (domainOptions.cleanedRequest) {
        this.processRequest(event, domainOptions.cleanedRequest);
    }
    delete domainOptions.cleanedRequest;

    if (options.apiKey) {
        this.apiKey = options.apiKey;
        delete options.apiKey;
    } else {
        this.apiKey = Configuration.apiKey;
    }

    if (process.domain && process.domain._bugsnagSession) {
        process.domain._bugsnagSession.trackError({ _handledState: handledState });
        event.session = process.domain._bugsnagSession.toJSON();
    }

    if (Object.keys(domainOptions).length > 0) {
        Utils.mergeObjects(event.metaData, domainOptions);
    }

    if (Object.keys(options).length > 0) {
        Utils.mergeObjects(event.metaData, options);
    }

    this.notifier = notifier;

    this.events = [event];
};

Notification.prototype.deliver = function(cb, originalError) {

    // did the user set severity?
    var userSeverity = this.events[0].severity;
    var userSpecifiedSeverity = userSeverity && userSeverity !== this.handledState.originalSeverity;

    // annotate this property so that we can check if the "beforeNotify" callbacks changed it
    // can't annotate a string literal ""/'', so create a String() object, woo!
    if (userSpecifiedSeverity) {
      this.events[0].severity = new String(userSpecifiedSeverity);
      this.events[0].severity.__userSpecifiedSeverity = true;
    }

    // run "beforeNotify" callbacks
    var shouldNotify = true;
    Configuration.beforeNotifyCallbacks.forEach(function (callback) {
        var ret = callback(this, originalError);
        if (ret === false) {
            shouldNotify = false;
        }
    }.bind(this));

    // did any of the the callbacks set the severity?
    var callbackSeverity = this.events[0].severity;
    var callbackSetSeverity = callbackSeverity && !callbackSeverity.__userSpecifiedSeverity && callbackSeverity !== this.handledState.originalSeverity;

    if (callbackSetSeverity && SUPPORTED_SEVERITIES.indexOf(callbackSeverity) !== -1) {
        // callbacks set a valid severity value
        this.events[0].severity = callbackSeverity;
        this.events[0].severityReason = { type: "userCallbackSetSeverity" };
    } else if (userSpecifiedSeverity && SUPPORTED_SEVERITIES.indexOf(userSeverity) !== -1) {
        // user specified a valid severity value
        this.events[0].severity = userSeverity;
        this.events[0].severityReason = { type: "userSpecifiedSeverity" };
    } else {
        // user did not specify severity, or specified and invalid value
        this.events[0].severity = this.handledState.originalSeverity;
        this.events[0].severityReason = this.handledState.severityReason;
    }

    // finally, add whether the error was unhandled so that callbacks can't fiddle with it
    this.events[0].unhandled = this.handledState.unhandled;

    if (!shouldNotify) {
        if (cb) {
            cb(new Error("At least one beforeNotify callback prevented the event from being sent to Bugsnag."));
        }
        return;
    }

    this._deliver(cb);
};

Notification.prototype._deliver = function (cb) {

    if (typeof cb !== "function") {
        cb = null;
    }

    var port = Configuration.notifyPort || (Configuration.useSSL ? 443 : 80);

    Configuration.logger.info("Delivering exception to " + (Configuration.useSSL ? "https" : "http") + "://" + Configuration.notifyHost + ":" + port + Configuration.notifyPath);

    var payload = this.serializePayload();

    var headers = Utils.cloneObject(Configuration.headers || {});
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = Buffer.byteLength(payload, "utf8");
    headers["Bugsnag-Api-Key"] = this.apiKey;
    headers["Bugsnag-Sent-At"] = new Date().toISOString();
    headers["Bugsnag-Payload-Version"] = "4.0";

    var options = {
        url: Configuration.endpoints.notify,
        proxy: Configuration.proxy,
        body: payload,
        headers: headers
    };

    Configuration.logger.info(payload);

    return request.post(options, function(err, res, body) {
        if (err) {
            if (cb) {
                return cb(err);
            } else {
                return Configuration.logger.error(err);
            }
        } else {
            if (cb) {
                if (res.statusCode === 200) {
                    return cb(null, body);
                } else {
                    return cb(new Error(body));
                }
            }
        }
    });
};

Notification.prototype.serializePayload = function() {
    var handledState = this.handledState;
    delete this.handledState;
    var event = this.events[0];
    [ "user", "app", "metaData", "breadcrumbs", "request", "device" ].forEach(function (prop) {
        event[prop] = Utils.filterObject(event[prop], Configuration.filters)
    });
    var payload = stringify(this, null, null, function() {
        return "[RECURSIVE]";
    });
    this.handledState = handledState;
    return payload;
}

Notification.prototype.processRequest = function(event, cleanRequest) {
    if (!event.metaData) {
        event.metaData = {};
    }
    event.metaData.request = cleanRequest;
    if (!event.context) {
        event.context = cleanRequest.path || cleanRequest.url;
    }
    if (!event.user || !event.user.id) {
        event.user = event.user || {}
        if (cleanRequest.headers && cleanRequest.headers['x-forwarded-for']) {
            event.user.id = cleanRequest.headers['x-forwarded-for'];
        } else if (cleanRequest.connection && cleanRequest.connection.remoteAddress) {
            event.user.id = cleanRequest.connection.remoteAddress;
        }
    }
    // migrate sanctioned request properties to event.request
    event.request = {};
    [ "clientIp", "headers", "httpMethod", "url", "referer" ].forEach(function (key) {
      event.request[key] = event.metaData.request[key]
      delete event.metaData.request[key]
    });
};

Notification.prototype.loadCode = function (callback) {
    return Promise.all(this.events.map(function (event) {
        return Promise.all(event.exceptions.map(function (error) {
            return new Promise(function (resolve) {
                error.loadCode(resolve);
            });
        }));
    })).then(callback);
};

module.exports = Notification;
