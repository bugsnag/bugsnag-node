var Bugsnag, Logger, Notification, Utils;

Bugsnag = require("./bugsnag");

Utils = require("./utils");

Logger = require("./logger");

module.exports = Notification = (function() {
  var responseCallback;

  function Notification(bugsnagError, options) {
    var _base;
    if (options == null) {
      options = {};
    }
    this.events = [
      {
        exceptions: [bugsnagError]
      }
    ];
    if (options.userId || Bugsnag.userId) {
      this.events[0].userId = options.userId || Bugsnag.userId;
    }
    if (Bugsnag.appVersion) {
      this.events[0].appVersion = Bugsnag.appVersion;
    }
    if (Bugsnag.releaseStage) {
      this.events[0].releaseStage = Bugsnag.releaseStage;
    }
    if (options.context || Bugsnag.context) {
      this.events[0].context = options.context || Bugsnag.context;
    }
    if (Bugsnag.osVersion) {
      this.events[0].osVersion = Bugsnag.osVersion;
    }
    delete options.userId;
    delete options.context;
    if (Bugsnag.metaData && Object.keys(Bugsnag.metaData).length > 0) {
      this.events[0].metaData = Utils.cloneObject(Bugsnag.metaData);
    }
    if (options.req) {
      this.processRequest(options.req);
      delete options.req;
    }
    if (Object.keys(options).length > 0) {
      Utils.mergeObjects((_base = this.events[0]).metaData || (_base.metaData = {}), options);
    }
    this.apiKey = Bugsnag.apiKey;
    this.notifier = {
      name: Bugsnag.NOTIFIER_NAME,
      version: Bugsnag.NOTIFIER_VERSION,
      url: Bugsnag.NOTIFIER_URL
    };
  }

  Notification.prototype.processRequest = function(req) {
    var _base, _base1, _base2, _ref, _ref1, _ref10, _ref11, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    (_base = this.events[0]).metaData || (_base.metaData = {});
    this.events[0].metaData.request = {
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
    (_base1 = this.events[0]).context || (_base1.context = req.url);
    return (_base2 = this.events[0]).userId || (_base2.userId = (req != null ? (_ref10 = req.headers) != null ? _ref10["x-forwarded-for"] : void 0 : void 0) || ((_ref11 = req.connection) != null ? _ref11.remoteAddress : void 0));
  };

  Notification.prototype.deliver = function(cb) {
    var options, payload, port, req;
    if (Utils.typeOf(cb) !== "function") {
      cb = null;
    }
    Utils.filterObject(this.events[0].metaData, Bugsnag.filters);
    port = Bugsnag.notifyPort || (Bugsnag.useSSL ? 443 : 80);
    Logger.info("Delivering exception to " + Bugsnag.notifyHost + ":" + port + Bugsnag.notifyPath);
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
    Logger.info(payload);
    if (Bugsnag.useSSL) {
      req = require("https").request(options, responseCallback(cb));
    } else {
      req = require("http").request(options, responseCallback(cb));
    }
    req.on("error", function(err) {
      if (cb) {
        return cb(err);
      } else {
        return Logger.error(err);
      }
    });
    req.write(payload, "utf-8");
    return req.end();
  };

  responseCallback = function(cb) {
    if (Utils.typeOf(cb) !== "function") {
      cb = null;
    }
    return function(res) {
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
    };
  };

  return Notification;

})();
