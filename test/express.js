var Notification, assert, bugsnag, express, request, sinon;

express = require('express');

sinon = require('sinon');

assert = require('assert');

bugsnag = require("../");

request = require('request');

Notification = require("../lib/notification");

bugsnag.register('00112233445566778899aabbccddeeff');

describe("express middleware", function() {
  var deliverStub;
  deliverStub = null;
  beforeEach(function() {
    return deliverStub = sinon.stub(Notification.prototype, "_deliver");
  });
  afterEach(function() {
    return Notification.prototype._deliver.restore();
  });
  return it("should automatically collect request data", function(next) {
    var app, port;
    app = express();
    app.use(app.router);
    app.use(bugsnag.requestHandler);
    app.use(bugsnag.errorHandler);
    app.get("/ping", function(req, res, next) {
      throw new RangeError();
      return res.sned("pong");
    });
    port = app.listen().address().port;
    return request.get("http://localhost:" + port + "/ping", function(err, res, body) {
      assert(deliverStub.calledOnce);
      var event = deliverStub.firstCall.thisValue.events[0];
      var req = event.request;
      var metaReq = event.metaData.request;
      assert.equal(req.url, "http://localhost:" + port + "/ping");
      assert.equal(metaReq.path, "/ping");
      assert.equal(req.httpMethod, "GET");
      assert.equal(req.headers.host, "localhost:" + port);
      assert.equal(metaReq.httpVersion, "1.1");
      assert.notEqual(["127.0.0.1", "::ffff:127.0.0.1"].indexOf(metaReq.connection.remoteAddress), -1);
      assert.equal(metaReq.connection.localPort, port);
      assert.notEqual(["IPv4", "IPv6"].indexOf(metaReq.connection.IPVersion), -1);
      // check the event got the correct handled/unhandled properties set
      assert.equal(event.unhandled, true);
      assert.equal(event.severity, "error");
      assert.deepEqual(event.severityReason, { type: "unhandledErrorMiddleware", attributes: { framework: "Express/Connect" } });
      return next();
    });
  });
});
