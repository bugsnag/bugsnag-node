var libpath = process.env['BUGSNAG_COV'] ? '../lib-cov/' : '../lib/',
    should = require("chai").should(),
    bluebird = require("bluebird"),
    when = require("when"),
    sinon = require("sinon"),
    koa = require("koa"),
    route = require('koa-route'),
    request = require("request"),
    Bugsnag = require(libpath + "bugsnag"),
    Notification = require(libpath + "notification"),
    fs = bluebird.promisifyAll(require("fs"));


describe("koa middleware", function() {
  var app = null,
      server = null,
      port = 8090,
      url = "http://localhost:" + port;

  before(function() {
    Bugsnag.register('SOME-OTHER-KEY');
    app = new koa();
    app.on('error', Bugsnag.koaHandler);
    process.on('unhandledRejection', function(err) { Bugsnag.notify(err) });
    app.use(route.get("/async", function(ctx) {
      process.nextTick(function() {
        Bugsnag.autoNotify(function() { throw new RangeError(); });
        ctx.body = "Hello";
      });
    }));
    app.use(route.get("/when", function(ctx) {
      var promise = when.promise(function(res) { res() });
      promise.reject(new RangeError());
      ctx.body = 'hello';
    }));
    app.use(route.get("/bluebird", function(ctx) {
      var promise = new bluebird(function() {});
      promise.reject(new RangeError());
      ctx.body = 'hello';
    }));
    app.use(route.get("/fail", function(ctx) {
      throw new RangeError();
    }));
    server = app.listen(port);
  });

  beforeEach(function() {
    process.removeAllListeners('unhandledRejection');
    deliverStub = sinon.stub(Notification.prototype, "_deliver");
  });

  afterEach(function() {
    Notification.prototype._deliver.restore();
  });

  after(function() {
    server.close();
  });

  describe("capturing unhandled synchronous errors", function() {

    it("sends one report", function(done) {
      request.get(url + "/fail", {timeout: 10}, function(err, res, body) {
        deliverStub.calledOnce.should.equal(true);
        done();
      });
    });

    it("sets the severity to error", function(done) {
      request.get(url + "/fail", {timeout: 20}, function(err, res, body) {
        var severity = deliverStub.firstCall.thisValue.events[0].severity;
        severity.should.equal("error");
        done();
      });
    });

    it("attaches request method to metadata", function(done) {
      request.get(url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        req.method.should.equal("GET");
        done();
      });
    });

    it("attaches request http version to metadata", function(done) {
      request.get(url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        req.httpVersion.should.equal("1.1");
        done();
      });
    });

    it("attaches request path to metadata", function(done) {
      request.get(url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        req.path.should.equal("/fail");
        done();
      });
    });

    it("attaches request port to metadata", function(done) {
      request.get(url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        req.connection.localPort.should.equal(port);
        done();
      });
    });

    it("attaches request connection protocol version to metadata", function(done) {
      request.get(url + "/fail", {timeout: 10}, function(err, res, body) {
        var req = deliverStub.firstCall.thisValue.events[0].metaData.request;
        ["IPv4", "IPv6"].should.contain(req.connection.IPVersion)
        done();
      });
    });
  });

  describe("capturing unhandled asynchronous errors", function() {
    it("sends one report", function(done) {
      request.get(url + "/async", {timeout: 10}, function() {
        deliverStub.callCount.should.equal(1);
        done();
      });
    });
  });

  describe("capturing rejected promises from when.js", function() {
    it("sends one report", function(done) {
      request.get(url + "/when", {timeout: 10}, function() {
        deliverStub.callCount.should.equal(1);
        done();
      });
    });
  });

  describe("capturing rejected promises from bluebird", function() {
    it("sends one report", function(done) {
      request.get(url + "/bluebird", {timeout: 10}, function() {
        deliverStub.callCount.should.equal(1);
        done();
      });
    });
  });
});
