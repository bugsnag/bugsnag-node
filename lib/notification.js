"use strict";

var Promise = require('promise'),
    Utils = require("./utils"),
    Logger = require("./logger"),
    Configuration = require("./configuration"),
    requestInfo = require("./request_info"),
    path = require("path"),
    request = require("request"),
    stringify = require("json-stringify-safe");

var NOTIFIER_NAME = "Bugsnag Node Notifier",
    NOTIFIER_VERSION = "1.12.2",
    NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node",
    SUPPORTED_SEVERITIES = ["error", "warning", "info"];

function Notification(bugsnagErrors, options) {
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
        event.appVersion = Configuration.appVersion;
    }

    if (Configuration.releaseStage) {
        event.releaseStage = Configuration.releaseStage;
    }

    if (Configuration.payloadVersion) {
        event.payloadVersion = Configuration.payloadVersion;
    }

    if (options.severity && SUPPORTED_SEVERITIES.indexOf(options.severity) >= 0) {
        event.severity = options.severity;
    } else {
        event.severity = "warning";
    }

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

    if (Object.keys(domainOptions).length > 0) {
        Utils.mergeObjects(event.metaData, domainOptions);
    }

    if (Object.keys(options).length > 0) {
        Utils.mergeObjects(event.metaData, options);
    }

    this.notifier = {
        name: NOTIFIER_NAME,
        version: NOTIFIER_VERSION,
        url: NOTIFIER_URL
    };

    this.events = [event];
}

Notification.prototype.deliver = function(cb, originalError) {

    // run before notify callbacks
    var shouldNotify = true;
    Configuration.beforeNotifyCallbacks.forEach(function (callback) {
        var ret = callback(this, originalError);
        if (ret === false) {
            shouldNotify = false;
        }
    }.bind(this));

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

    // Filter before sending
    this.events[0].metaData = Utils.filterObject(this.events[0].metaData, Configuration.filters);

    var port = Configuration.notifyPort || (Configuration.useSSL ? 443 : 80);

    Configuration.logger.info("Delivering exception to " + (Configuration.useSSL ? "https" : "http") + "://" + Configuration.notifyHost + ":" + port + Configuration.notifyPath);

    var payload = this.serializePayload();

    var headers = Utils.cloneObject(Configuration.headers || {});
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = Buffer.byteLength(payload, "utf8")

    var options = {
        url: "" + (Configuration.useSSL ? "https" : "http") + "://" + Configuration.notifyHost + ":" + port + Configuration.notifyPath,
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
    return stringify(this, null, null, function() {
        return "[RECURSIVE]";
    });
}

Notification.prototype.processRequest = function(event, cleanRequest) {
    if (!event.metaData) {
        event.metaData = {};
    }
    event.metaData.request = cleanRequest;
    if (!event.context) {
        event.context = cleanRequest.path || cleanRequest.url;
    }
    if (!event.userId) {
        if (cleanRequest.headers && cleanRequest.headers['x-forwarded-for']) {
            event.userId = cleanRequest.headers['x-forwarded-for'];
        } else if (cleanRequest.connection && cleanRequest.connection.remoteAddress) {
            event.userId = cleanRequest.connection.remoteAddress;
        }
    }
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
