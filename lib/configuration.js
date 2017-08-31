"use strict";

var path = require("path"),
    Logger = require("./logger"),
    Utils = require("./utils");

var PAYLOAD_VERSION = "2";

var Configuration = {
    filters: ["password"],
    notifyReleaseStages: null,
    projectRoot: require.main !== undefined && require.main.filename !== undefined ? path.dirname(require.main.filename) : null,
    autoNotifyUncaught: true,
    useSSL: true,
    proxy: null,
    headers: {},
    notifyHost: "notify.bugsnag.com",
    notifyPath: "/",
    notifyPort: undefined,
    hostname: process.env.DYNO ? null : require("os").hostname(),
    apiKey: process.env.BUGSNAG_API_KEY,
    releaseStage: process.env.NODE_ENV || "production",
    appVersion: null,
    metaData: {},
    logger: new Logger(),
    sendCode: true,

    beforeNotifyCallbacks: [],

    // The callback fired when we receive an uncaught exception. Defaults to printing the next stack and exiting.
    onUncaughtError: function(err) {
        if ((err instanceof Error) && err.domain) {
            if (err.domainThrown || err.domainEmitter || err.domainThrown === void 0) {
            Configuration.logger.error(err.stack || err);
            return process.exit(1);
            }
        } else {
            Configuration.logger.error(err.stack || err);
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
        Configuration.payloadVersion = PAYLOAD_VERSION;
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
        Configuration.proxy = options.proxy;
        Configuration.headers = options.headers;
        if (options.projectRoot != null) {
            Configuration.projectRoot = Utils.fullPath(options.projectRoot);
        }
        if ((options.packageJSON != null) && !Configuration.appVersion) {
            Configuration.appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON));
        }
        Configuration.sendCode = options.sendCode || Configuration.sendCode;
    }
}

module.exports = Configuration;
