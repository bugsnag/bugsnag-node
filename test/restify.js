var libpath = process.env['BUGSNAG_COV'] ? '../lib-cov/' : '../lib/',
    should = require("chai").should(),
    sinon = require("sinon"),
    restify = require("restify"),
    request = require("request"),
    Bugsnag = require(libpath + "bugsnag"),
    Notification = require(libpath + "notification");

describe("Restify support", function() {
  var server = null,
      deliverStub = null;

  before(function() {
    Bugsnag.register('SOME-KEY');
    server = restify.createServer({ name: 'testapp', version: '1.0.0' });
    server.on("uncaughtException", Bugsnag.restifyHandler);
    server.get("/fail", function(req, res, next) {
      throw new RangeError();
      return next();
    });
    server.listen(8030);
  });

  after(function() {
    server.close();
  });

  beforeEach(function() {
    deliverStub = sinon.stub(Notification.prototype, "_deliver");
  });

  afterEach(function() {
    Notification.prototype._deliver.restore();
  });

  describe("capturing unhandled errors", function() {

    it("sends only one report", function(done) {
      request.get(server.url + "/fail", {timeout: 10}, function(err, res, body) {
        deliverStub.calledOnce.should.equal(true);
        done();
      });
    });

    it("sets the severity to error", function(done) {
      request.get(server.url + "/fail", {timeout: 20}, function(err, res, body) {
        var severity = deliverStub.firstCall.thisValue.events[0].severity;
        severity.should.equal("error");
        done();
      });
    });

    it("attaches request method to metadata", function(done) {
      request.get(server.url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        req.method.should.equal("GET");
        done();
      });
    });

    it("attaches request http version to metadata", function(done) {
      request.get(server.url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        req.httpVersion.should.equal("1.1");
        done();
      });
    });

    it("attaches request path to metadata", function(done) {
      request.get(server.url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        req.path.should.equal("/fail");
        done();
      });
    });

    it("attaches request port to metadata", function(done) {
      request.get(server.url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        req.connection.localPort.should.equal(8030);
        done();
      });
    });

    it("attaches request connection protocol version to metadata", function(done) {
      request.get(server.url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        ["IPv4", "IPv6"].should.contain(req.connection.IPVersion)
        done();
      });
    });
  });
});
