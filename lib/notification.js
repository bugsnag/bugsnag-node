var Bugsnag, Logger, Notification, Utils, path;

Bugsnag = require("./bugsnag");

Utils = require("./utils");

Logger = require("./logger");

path = require("path");

module.exports = Notification = (function() {
  var NOTIFIER_NAME, NOTIFIER_URL, NOTIFIER_VERSION;

  NOTIFIER_NAME = "Bugsnag Node Notifier";

  NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'));

  NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node";

  function Notification(bugsnagError, options) {
    var event;
    if (options == null) {
      options = {};
    }
    event = {
      exceptions: [bugsnagError]
    };
    if (options.userId) {
      event.userId = options.userId;
    }
    if (Bugsnag.appVersion) {
      event.appVersion = Bugsnag.appVersion;
    }
    if (Bugsnag.releaseStage) {
      event.releaseStage = Bugsnag.releaseStage;
    }
    if (options.context) {
      event.context = options.context;
    }
    if (Bugsnag.osVersion) {
      event.osVersion = Bugsnag.osVersion;
    }
    delete options.userId;
    delete options.context;
    if (Bugsnag.metaData && Object.keys(Bugsnag.metaData).length > 0) {
      event.metaData = Utils.cloneObject(Bugsnag.metaData);
    }
    if (options.req) {
      this.processRequest(event, options.req);
      delete options.req;
    }
    if (Object.keys(options).length > 0) {
      Utils.mergeObjects(event.metaData || (event.metaData = {}), options);
    }
    this.apiKey = Bugsnag.apiKey;
    this.notifier = {
      name: NOTIFIER_NAME,
      version: NOTIFIER_VERSION,
      url: NOTIFIER_URL
    };
    this.events = [event];
  }

  Notification.prototype.deliver = function(cb) {
    var lib, options, payload, port, req;
    if (Utils.typeOf(cb) !== "function") {
      cb = null;
    }
    Utils.filterObject(this.events[0].metaData, Bugsnag.filters);
    port = Bugsnag.notifyPort || (Bugsnag.useSSL ? 443 : 80);
    Bugsnag.logger.info("Delivering exception to " + (Bugsnag.useSSL ? "https" : "http") + "://" + Bugsnag.notifyHost + ":" + port + Bugsnag.notifyPath);
    payload = JSON.stringify(this);
    options = {
      host: Bugsnag.notifyHost,
      port: port,
      path: Bugsnag.notifyPath,
      method: 'POST',
      headers: {
        "Content-Type": 'application/json',
        "Content-Length": payload.length
      }
    };
    Bugsnag.logger.info(payload);
    lib = Bugsnag.useSSL ? require("https") : require("http");
    req = lib.request(options, function(res) {
      var bodyRes;
      if (cb) {
        bodyRes = "";
        res.setEncoding('utf8');
      }
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
    });
    req.on("error", function(err) {
      if (cb) {
        return cb(err);
      } else {
        return Bugsnag.logger.error(err);
      }
    });
    req.write(payload, "utf-8");
    return req.end();
  };

  Notification.prototype.processRequest = function(event, req) {
    var _ref, _ref1, _ref10, _ref11, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    event.metaData || (event.metaData = {});
    event.metaData.request = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      httpVersion: req.httpVersion,
      connection: {
        remoteAddress: (_ref = req.connection) != null ? _ref.remoteAddress : void 0,
        remotePort: (_ref1 = req.connection) != null ? _ref1.remotePort : void 0,
        bytesRead: (_ref2 = req.connection) != null ? _ref2.bytesRead : void 0,
        bytesWritten: (_ref3 = req.connection) != null ? _ref3.bytesWritten : void 0,
        localPort: (_ref4 = req.connection) != null ? (_ref5 = _ref4.address()) != null ? _ref5.port : void 0 : void 0,
        localAddress: (_ref6 = req.connection) != null ? (_ref7 = _ref6.address()) != null ? _ref7.address : void 0 : void 0,
        IPVersion: (_ref8 = req.connection) != null ? (_ref9 = _ref8.address()) != null ? _ref9.family : void 0 : void 0
      }
    };
    event.context || (event.context = req.url);
    return event.userId || (event.userId = (req != null ? (_ref10 = req.headers) != null ? _ref10["x-forwarded-for"] : void 0 : void 0) || ((_ref11 = req.connection) != null ? _ref11.remoteAddress : void 0));
  };

  return Notification;

})();
