var Configuration, Logger, Notification, Utils, path, request, requestInfo,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Utils = require("./utils");

Logger = require("./logger");

Configuration = require("./configuration");

requestInfo = require("./request_info");

path = require("path");

request = require("request");

module.exports = Notification = (function() {
  var NOTIFIER_NAME, NOTIFIER_URL, NOTIFIER_VERSION, SUPPORTED_SEVERITIES;

  NOTIFIER_NAME = "Bugsnag Node Notifier";

  NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'));

  NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node";

  SUPPORTED_SEVERITIES = ["error", "warning", "info"];

  function Notification(bugsnagErrors, options) {
    var domainOptions, event, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    if (options == null) {
      options = {};
    }
    event = {
      exceptions: bugsnagErrors
    };
    if (options.userId || (typeof process !== "undefined" && process !== null ? (_ref = process.domain) != null ? (_ref1 = _ref._bugsnagOptions) != null ? _ref1.userId : void 0 : void 0 : void 0)) {
      event.userId = options.userId || (typeof process !== "undefined" && process !== null ? (_ref2 = process.domain) != null ? (_ref3 = _ref2._bugsnagOptions) != null ? _ref3.userId : void 0 : void 0 : void 0);
    }
    if (options.context || (typeof process !== "undefined" && process !== null ? (_ref4 = process.domain) != null ? (_ref5 = _ref4._bugsnagOptions) != null ? _ref5.context : void 0 : void 0 : void 0)) {
      event.context = options.context || (typeof process !== "undefined" && process !== null ? (_ref6 = process.domain) != null ? (_ref7 = _ref6._bugsnagOptions) != null ? _ref7.context : void 0 : void 0 : void 0);
    }
    if (options.groupingHash || (typeof process !== "undefined" && process !== null ? (_ref8 = process.domain) != null ? (_ref9 = _ref8._bugsnagOptions) != null ? _ref9.groupingHash : void 0 : void 0 : void 0)) {
      event.groupingHash = options.groupingHash || (typeof process !== "undefined" && process !== null ? (_ref10 = process.domain) != null ? (_ref11 = _ref10._bugsnagOptions) != null ? _ref11.groupingHash : void 0 : void 0 : void 0);
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
    if ((options.severity != null) && (_ref12 = options.severity, __indexOf.call(SUPPORTED_SEVERITIES, _ref12) >= 0)) {
      event.severity = options.severity;
    } else {
      event.severity = "warning";
    }
    delete options.userId;
    delete options.context;
    delete options.groupingHash;
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
    } else if (typeof process !== "undefined" && process !== null ? (_ref13 = process.domain) != null ? (_ref14 = _ref13._bugsnagOptions) != null ? _ref14.cleanedRequest : void 0 : void 0 : void 0) {
      this.processRequest(event, process.domain._bugsnagOptions.cleanedRequest);
    }
    if (typeof process !== "undefined" && process !== null ? (_ref15 = process.domain) != null ? _ref15._bugsnagOptions : void 0 : void 0) {
      domainOptions = Utils.cloneObject(process.domain._bugsnagOptions, {
        except: ["req", "context", "userId", "groupingHash"]
      });
      if (Object.keys(domainOptions).length > 0) {
        Utils.mergeObjects(event.metaData || (event.metaData = {}), domainOptions);
      }
    }
    if (Object.keys(options).length > 0) {
      Utils.mergeObjects(event.metaData || (event.metaData = {}), options);
    }
    this.apiKey = Configuration.apiKey;
    this.notifier = {
      name: NOTIFIER_NAME,
      version: NOTIFIER_VERSION,
      url: NOTIFIER_URL
    };
    this.events = [event];
  }

  Notification.prototype.deliver = function(cb) {
    var cache, notifyUrl, options, payload, port;
    if (Utils.typeOf(cb) !== "function") {
      cb = null;
    }
    Utils.filterObject(this.events[0].metaData, Configuration.filters);
    port = Configuration.notifyPort || (Configuration.useSSL ? 443 : 80);
    Configuration.logger.info("Delivering exception to " + (Configuration.useSSL ? "https" : "http") + "://" + Configuration.notifyHost + ":" + port + Configuration.notifyPath);
    cache = [];
    payload = JSON.stringify(this, function(key, value) {
      if (Utils.typeOf(value) === "object") {
        if (cache.indexOf(value) !== -1) {
          return;
        }
        cache.push(value);
      }
      return value;
    });
    notifyUrl = "" + (Configuration.useSSL ? "https" : "http") + "://" + Configuration.notifyHost + ":" + port + Configuration.notifyPath;
    options = {
      proxy: Configuration.proxy,
      body: payload,
      headers: {
        "Content-Type": 'application/json',
        "Content-Length": Buffer.byteLength(payload, 'utf8')
      }
    };
    Configuration.logger.info(payload);
    return request.post(notifyUrl, options, function(err, res, body) {
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

  Notification.prototype.processRequest = function(event, cleanRequest) {
    var _ref, _ref1;
    event.metaData || (event.metaData = {});
    event.metaData.request = cleanRequest;
    event.context || (event.context = cleanRequest.path || cleanRequest.url);
    return event.userId || (event.userId = (cleanRequest != null ? (_ref = cleanRequest.headers) != null ? _ref["x-forwarded-for"] : void 0 : void 0) || (cleanRequest != null ? (_ref1 = cleanRequest.connection) != null ? _ref1.remoteAddress : void 0 : void 0));
  };

  return Notification;

})();
