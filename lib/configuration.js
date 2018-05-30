"use strict";

var path = require("path"),
    Logger = require("./logger"),
    Utils = require("./utils"),
    url = require("url");

var defaultEndpoints = {
    notify: "https://notify.bugsnag.com/",
    sessions: "https://sessions.bugsnag.com/"
}

var Configuration = {
    filters: ["password"],
    notifyReleaseStages: null,
    projectRoot: require.main !== undefined && require.main.filename !== undefined ? path.dirname(require.main.filename) : null,
    autoNotifyUncaught: true,
    autoNotifyUnhandledRejection: true,
    proxy: null,
    headers: {},
    hostname: process.env.DYNO ? null : require("os").hostname(),
    apiKey: process.env.BUGSNAG_API_KEY,
    releaseStage: process.env.NODE_ENV || "production",
    appVersion: null,
    appType: null,
    metaData: {},
    logger: new Logger(),
    sendCode: true,
    autoCaptureSessions: true,
    endpoints: Object.assign({}, defaultEndpoints),

    beforeNotifyCallbacks: [],

    // The callback fired when we receive an uncaught exception. Defaults to printing the next stack and exiting.
    onUncaughtError: function(err) {
        if ((err instanceof Error) && err.domain) {
            if (err.domainThrown || err.domainEmitter || err.domainThrown === void 0) {
                var context = "";
                if (err.domain._bugsnagOptions && err.domain._bugsnagOptions.cleanedRequest) {
                    context += " at " + err.domain._bugsnagOptions.cleanedRequest.httpMethod;
                    context += " " + err.domain._bugsnagOptions.cleanedRequest.path + "";
                }
                Configuration.logger.error("Encountered an uncaught error" + context + " terminating…\n" + (err.stack || err));
                return process.exit(1);
            }
        } else {
            Configuration.logger.error("Encountered an uncaught error, terminating…\n" + (err.stack || err));
            return process.exit(1);
        }
    },

    configure: function(options) {
        // Do this before we do any logging
        if (options.logger) {
            Configuration.logger = options.logger;
        }
        if (options.logLevel) {
            Configuration.logger.logLevel = options.logLevel;
        }
        Configuration.releaseStage = options.releaseStage || Configuration.releaseStage;
        Configuration.appVersion = options.appVersion || Configuration.appVersion;
        Configuration.appType = options.appType || Configuration.appType;
        Configuration.autoNotifyUncaught = options.autoNotify != null ? options.autoNotify : Configuration.autoNotifyUncaught;
        Configuration.autoNotifyUnhandledRejection = options.autoNotifyUnhandledRejection === false ? false : (options.autoNotify != null ? options.autoNotify : Configuration.autoNotifyUnhandledRejection);
        Configuration.filters = options.filters || Configuration.filters;
        Configuration.notifyReleaseStages = options.notifyReleaseStages || Configuration.notifyReleaseStages;
        Configuration.metaData = options.metaData || Configuration.metaData;
        Configuration.onUncaughtError = options.onUncaughtError || Configuration.onUncaughtError;
        Configuration.hostname = options.hostname || Configuration.hostname;
        Configuration.proxy = options.proxy;
        Configuration.headers = options.headers;
        if (options.projectRoot != null) {
            Configuration.projectRoot = Utils.fullPath(options.projectRoot);
        }
        if ((options.packageJSON != null) && !Configuration.appVersion) {
            Configuration.appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON));
        }
        Configuration.sendCode = options.sendCode || Configuration.sendCode;
        Configuration.endpoints = configureEndpoints(options, defaultEndpoints, Configuration.logger);
        Configuration.autoCaptureSessions = configureSessionTracking(Configuration.endpoints, options, true, Configuration.logger);
        validateEndpoints(Configuration.endpoints, Configuration.autoCaptureSessions);
    }
}

function constructDefaultNotifyEndpoint(useSSL, hostname, pathname, port) {
    return url.format({
        protocol: useSSL === false ? "http" : "https",
        hostname: hostname || "notify.bugsnag.com",
        port: port || undefined,
        pathname: pathname || "/"
    });
}

function configureEndpoints(options, defaults, logger) {
    // if endpoints was provided, use that
    if (options.endpoints) return options.endpoints;
    // otherwise if any deprecated option to do with url construction was set, use it to construct the notify endpoint
    if (options.useSSL === false || options.notifyHost || options.notifyPath || options.notifyPort) {
        logger.error("The \"useSSL\", \"notifyHost\", \"notifyPath\" and \"notifyPort\" options are deprecated. Use the \"endpoints\" option to configure URLs")
        return {
            notify: constructDefaultNotifyEndpoint(options.useSSL, options.notifyHost, options.notifyPath, options.notifyPort),
            sessions: options.sessionEndpoint || defaults.sessions
        };
    }
    var endpoints = Object.assign({}, defaults);
    if (options.sessionEndpoint) {
        logger.error("The \"sessionEndpoint\" option is deprecated. Use the \"endpoints\" option to configure URLs");
        endpoints.sessions = options.sessionEndpoint;
    }
    return endpoints;
}

function configureSessionTracking(endpoints, options, defaults, logger) {
    // if either the current or deprecated option for session tracking is explicitly configured, use it
    if ([ true, false ].indexOf(options.autoCaptureSessions) !== -1) return options.autoCaptureSessions;
    if ([ true, false ].indexOf(options.sessionTrackingEnabled) !== -1) {
        logger.error("The \"sessionTrackingEnabled\" option is deprecated. Use the \"endpoints\" option instead");
        return options.sessionTrackingEnabled;
    }
    // if the notify endpoint is customized but the session endpoint isn't, it's probably an oversight, switch it off as a precaution
    if (endpoints.notify !== defaultEndpoints.notify && (!endpoints.sessions || endpoints.sessions === defaultEndpoints.sessions)) {
        logger.error("The session tracking endpoint has not been set. Session tracking is disabled");
        return false;
    }
    return defaults;
}

function validateEndpoints(endpoints, autoCaptureSessions) {
    if (!endpoints.notify) {
        throw new Error("The notify endpoint is not set");
    }
    if (autoCaptureSessions && !endpoints.sessions) {
        throw new Error("Session tracking is enabled but no session endpoint is set");
    }
    Object.keys(endpoints).forEach(function (k) {
        if ([ "notify", "sessions" ].indexOf(k) === -1) {
            throw new Error("Endpoints configuration contains unknown key \"" + k + "\"");
        }
    });
}

module.exports = Configuration;
