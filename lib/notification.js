var Configuration, Logger, Notification, Utils, continuationLocalStorage, path, requestInfo,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Utils = require("./utils");

Logger = require("./logger");

Configuration = require("./configuration");

requestInfo = require("./request_info");

path = require("path");

continuationLocalStorage = require("continuation-local-storage");

module.exports = Notification = (function() {
  var NOTIFIER_NAME, NOTIFIER_URL, NOTIFIER_VERSION, SUPPORTED_SEVERITIES;

  NOTIFIER_NAME = "Bugsnag Node Notifier";

  NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'));

  NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node";

  SUPPORTED_SEVERITIES = ["error", "warning", "info"];

  function Notification(bugsnagError, options) {
    var domainOptions, event, ns, _ref, _ref1;
    if (options == null) {
      options = {};
    }
    event = {
      exceptions: [bugsnagError]
    };
    ns = continuationLocalStorage.getNamespace("bugsnag");
    if (ns) {
      domainOptions = ns.get("options");
    }
    if (options.userId || (domainOptions != null ? domainOptions.userId : void 0)) {
      event.userId = options.userId || (domainOptions != null ? domainOptions.userId : void 0);
    }
    if (options.context || (domainOptions != null ? domainOptions.context : void 0)) {
      event.context = options.context || (domainOptions != null ? domainOptions.context : void 0);
    }
    if (options.groupingHash || (domainOptions != null ? domainOptions.groupingHash : void 0)) {
      event.groupingHash = options.groupingHash || (domainOptions != null ? domainOptions.groupingHash : void 0);
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
    if ((options.severity != null) && (_ref = options.severity, __indexOf.call(SUPPORTED_SEVERITIES, _ref) >= 0)) {
      event.severity = options.severity;
    } else if (((domainOptions != null ? domainOptions.severity : void 0) != null) && (_ref1 = domainOptions.severity, __indexOf.call(SUPPORTED_SEVERITIES, _ref1) >= 0)) {
      event.severity = domainOptions.severity;
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
    }
    if (domainOptions) {
      domainOptions = Utils.cloneObject(domainOptions, {
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
    var cache, lib, options, payload, port, req;
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
    options = {
      host: Configuration.notifyHost,
      port: port,
      path: Configuration.notifyPath,
      method: 'POST',
      headers: {
        "Content-Type": 'application/json',
        "Content-Length": payload.length
      }
    };
    Configuration.logger.info(payload);
    lib = Configuration.useSSL ? require("https") : require("http");
    req = lib.request(options, function(res) {
      var bodyRes;
      if (cb) {
        bodyRes = "";
        res.setEncoding('utf8');
        return res.on('data', function(chunk) {
          if (chunk) {
            return bodyRes += chunk;
          }
        }).on('end', function() {
          if (res.statusCode === 200) {
            return cb(null, bodyRes);
          } else {
            return cb(new Error(bodyRes));
          }
        });
      }
    });
    req.on("error", function(err) {
      if (cb) {
        return cb(err);
      } else {
        return Configuration.logger.error(err);
      }
    });
    req.write(payload, "utf-8");
    return req.end();
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
