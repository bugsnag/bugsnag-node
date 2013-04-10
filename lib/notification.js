var Configuration, Logger, Notification, Utils, path;

Utils = require("./utils");

Logger = require("./logger");

Configuration = require("./configuration");

path = require("path");

module.exports = Notification = (function() {
  var NOTIFIER_NAME, NOTIFIER_URL, NOTIFIER_VERSION;

  NOTIFIER_NAME = "Bugsnag Node Notifier";

  NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'));

  NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node";

  function Notification(bugsnagError, options) {
    var domainOptions, event, _ref, _ref1, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    if (options == null) {
      options = {};
    }
    event = {
      exceptions: [bugsnagError]
    };
    if (options.userId || (typeof process !== "undefined" && process !== null ? (_ref = process.domain) != null ? (_ref1 = _ref._bugsnagOptions) != null ? _ref1.userId : void 0 : void 0 : void 0)) {
      event.userId = options.userId || (typeof process !== "undefined" && process !== null ? (_ref2 = process.domain) != null ? (_ref3 = _ref2._bugsnagOptions) != null ? _ref3.userId : void 0 : void 0 : void 0);
    }
    if (options.context || (typeof process !== "undefined" && process !== null ? (_ref4 = process.domain) != null ? (_ref5 = _ref4._bugsnagOptions) != null ? _ref5.context : void 0 : void 0 : void 0)) {
      event.context = options.context || (typeof process !== "undefined" && process !== null ? (_ref6 = process.domain) != null ? (_ref7 = _ref6._bugsnagOptions) != null ? _ref7.context : void 0 : void 0 : void 0);
    }
    if (Configuration.appVersion) {
      event.appVersion = Configuration.appVersion;
    }
    if (Configuration.releaseStage) {
      event.releaseStage = Configuration.releaseStage;
    }
    delete options.userId;
    delete options.context;
    if (Configuration.metaData && Object.keys(Configuration.metaData).length > 0) {
      event.metaData = Utils.cloneObject(Configuration.metaData);
    }
    if (options.req || (typeof process !== "undefined" && process !== null ? (_ref8 = process.domain) != null ? (_ref9 = _ref8._bugsnagOptions) != null ? _ref9.req : void 0 : void 0 : void 0)) {
      this.processRequest(event, options.req || (typeof process !== "undefined" && process !== null ? (_ref10 = process.domain) != null ? (_ref11 = _ref10._bugsnagOptions) != null ? _ref11.req : void 0 : void 0 : void 0));
      delete options.req;
    }
    if (typeof process !== "undefined" && process !== null ? (_ref12 = process.domain) != null ? _ref12._bugsnagOptions : void 0 : void 0) {
      domainOptions = Utils.cloneObject(process.domain._bugsnagOptions, {
        except: ["req", "context", "userId"]
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

  Notification.prototype.processRequest = function(event, req) {
    var full_url, port, portNumber, _ref, _ref1, _ref10, _ref11, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    event.metaData || (event.metaData = {});
    portNumber = (_ref = req.connection) != null ? (_ref1 = _ref.address()) != null ? _ref1.port : void 0 : void 0;
    port = !(portNumber != null) || portNumber === 80 || portNumber === 443 ? '' : ':' + portNumber;
    full_url = req.protocol + '://' + req.host + port + req.url;
    event.metaData.request = {
      url: full_url,
      method: req.method,
      headers: req.headers,
      httpVersion: req.httpVersion,
      connection: {
        remoteAddress: (_ref2 = req.connection) != null ? _ref2.remoteAddress : void 0,
        remotePort: (_ref3 = req.connection) != null ? _ref3.remotePort : void 0,
        bytesRead: (_ref4 = req.connection) != null ? _ref4.bytesRead : void 0,
        bytesWritten: (_ref5 = req.connection) != null ? _ref5.bytesWritten : void 0,
        localPort: portNumber,
        localAddress: (_ref6 = req.connection) != null ? (_ref7 = _ref6.address()) != null ? _ref7.address : void 0 : void 0,
        IPVersion: (_ref8 = req.connection) != null ? (_ref9 = _ref8.address()) != null ? _ref9.family : void 0 : void 0
      }
    };
    if (req.params && Object.keys(req.params).length > 0) {
      event.metaData.request.params = req.params;
    }
    if (req.query && Object.keys(req.query).length > 0) {
      event.metaData.request.query = req.query;
    }
    if (req.body && Object.keys(req.body).length > 0) {
      event.metaData.request.body = req.body;
    }
    event.context || (event.context = req.path || req.url);
    return event.userId || (event.userId = (req != null ? (_ref10 = req.headers) != null ? _ref10["x-forwarded-for"] : void 0 : void 0) || ((_ref11 = req.connection) != null ? _ref11.remoteAddress : void 0));
  };

  return Notification;

})();
