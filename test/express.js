var Notification, assert, bugsnag, express, request, sinon;
var libpath = process.env['BUGSNAG_COV'] ? '../lib-cov/' : '../lib/';

express = require('express');
sinon = require('sinon');
assert = require('assert');
bugsnag = require(libpath + "bugsnag");
request = require('request');
Notification = require(libpath + "notification");

bugsnag.register('00112233445566778899aabbccddeeff');

describe("express middleware", function() {
  var deliverStub = null,
      server = null,
      port = null;

  before(function() {
    var app = express();
    app.use(app.router);
    app.use(bugsnag.requestHandler);
    app.use(bugsnag.errorHandler);
    app.get("/ping", function(req, res, next) {
      throw new RangeError();
    });
    server = app.listen();
    port = server.address().port;
  });

  beforeEach(function() {
    deliverStub = sinon.stub(Notification.prototype, "deliver");
  });

  afterEach(function() {
    Notification.prototype.deliver.restore();
  });

  after(function() {
    server.close();
  });

  it("sets severity to error", function(done) {
    request.get("http://localhost:" + port + "/ping",
      function() {
        var severity = deliverStub.firstCall.thisValue.events[0].severity;
        assert.equal(severity, 'error');
        done();
      });
  });

  it("should automatically collect request data", function(next) {
    request.get("http://localhost:" + port + "/ping?name=babs", function(err, res, body) {
      var req;
      assert(deliverStub.calledOnce);
      req = deliverStub.firstCall.thisValue.events[0].metaData.request;
      assert.equal(req.url, "http://localhost:" + port + "/ping?name=babs");
      assert.equal(req.path, "/ping");
      assert.equal(req.method, "GET");
      assert.equal(req.headers.host, "localhost:" + port);
      assert.equal(req.httpVersion, "1.1");
      assert.equal(req.query.name, 'babs');
      assert.notEqual(["127.0.0.1", "::ffff:127.0.0.1"].indexOf(req.connection.remoteAddress), -1);
      assert.equal(req.connection.localPort, port);
      assert.notEqual(["IPv4", "IPv6"].indexOf(req.connection.IPVersion), -1);
      next();
    });
  });
});

