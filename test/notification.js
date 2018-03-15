"use strict";

var path = require("path"),
    should = require("chai").should(),
    sinon = require("sinon"),
    Bugsnag = require("../"),
    Configuration = require("../lib/configuration"),
    Notification = require("../lib/notification"),
    request = require("request"),
    apiKey = null,
    deliverStub = null,
    child_process = require("child_process");

before(function() {
    apiKey = "71ab53572c7b45316fb894d446f2e11d";
    Bugsnag.register(apiKey, {
        notifyReleaseStages: ["production", "development"]
    });
});

describe("Notification transport", function() {
    beforeEach(function() {
        sinon.stub(request, "post");
        sinon.stub(Notification.prototype, "loadCode").callsArg(0);
    });

    afterEach(function() {
        request.post.restore();
        Notification.prototype.loadCode.restore();
    });

    it("sets the application type as JSON", function() {
        Bugsnag.configure({
            notifyReleaseStages: ["production", "development"]
        });
        Bugsnag.notify("This is the message");
        request.post.firstCall.args[0].headers["Content-Type"].should.equal("application/json");
    });

    it("adds the configuration headers", function() {
        Bugsnag.configure({
            notifyReleaseStages: ["production", "development"],
            headers: { "Proxy-Authorization" : "Basic dXNlcjuwYXWq" }
        });
        Bugsnag.notify("This is the message");
        request.post.firstCall.args[0].headers["Proxy-Authorization"].should.equal("Basic dXNlcjuwYXWq");
    });

    it("disallows overwriting the required headers", function() {
        Bugsnag.configure({
            notifyReleaseStages: ["production", "development"],
            headers: { "Content-Type" : "application/x-mp4" }
        });
        Bugsnag.notify("This is the message");
        request.post.firstCall.args[0].headers["Content-Type"].should.equal("application/json");
    });
});

describe("Notification headers", function() {
    beforeEach(function() {
        sinon.stub(request, "post");
        sinon.stub(Notification.prototype, "loadCode").callsArg(0);
    });

    afterEach(function() {
        request.post.restore();
        Notification.prototype.loadCode.restore();
    });

    it("should have the apiKey, payloadVersion and ", function() {
      Bugsnag.notify("This is the message");
      request.post.firstCall.args[0].headers["Bugsnag-Payload-Version"].should.equal("4.0");
    });

    it("should have the apiKey", function() {
      Bugsnag.notify("This is the message");
      request.post.firstCall.args[0].headers["Bugsnag-Api-Key"].should.equal(apiKey);
    });
});

describe("Notification", function() {
    beforeEach(function() {
        Bugsnag.configure({
            notifyReleaseStages: ["production", "development"]
        });
        deliverStub = sinon.stub(Notification.prototype, "_deliver");
        sinon.stub(Notification.prototype, "loadCode").callsArg(0);
    });

    afterEach(function() {
        Notification.prototype._deliver.restore();
        Configuration.beforeNotifyCallbacks = []
        Bugsnag.metaData = {}
        Notification.prototype.loadCode.restore();
    });

    it("should call deliver once", function() {
        Bugsnag.notify("This is the message");
        deliverStub.calledOnce.should.equal(true);
    });

    it("should have the correct notification format", function() {
        Bugsnag.notify("This is the message");
        deliverStub.firstCall.thisValue.should.be.an("object");
        deliverStub.firstCall.thisValue.should.have.keys(["apiKey", "notifier", "events", "handledState"]);
    });

    it("should identify the notifier properly", function() {
        Bugsnag.notify("This is the message");
        deliverStub.firstCall.thisValue.notifier.should.be.an("object");
        deliverStub.firstCall.thisValue.notifier.should.have.keys(["name", "version", "url"]);
        deliverStub.firstCall.thisValue.notifier.should.have.property("name", "Bugsnag Node Notifier");
        deliverStub.firstCall.thisValue.notifier.should.have.property("version", require("../package.json").version);
        deliverStub.firstCall.thisValue.notifier.should.have.property("url", "https://github.com/bugsnag/bugsnag-node");
    });

    it("should contain the APIKey", function() {
        Bugsnag.notify("This is the message");
        deliverStub.firstCall.thisValue.apiKey.should.equal(apiKey);
    });

    it("should allow overwriting the APIKey", function() {
        var newKey = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        Bugsnag.notify("This is the message", {apiKey: newKey});
        deliverStub.firstCall.thisValue.apiKey.should.equal(newKey);
    });

    it("should contain an event", function() {
        Bugsnag.notify("This is the message");
        deliverStub.firstCall.thisValue.events.length.should.equal(1);
        deliverStub.firstCall.thisValue.events[0].should.have.keys(
          "app", "exceptions", "device", "severity",
          "metaData", "unhandled", "severityReason"
        );
    });

    it("should handle recursive fields in the payload", function() {
        Bugsnag.onBeforeNotify(function(notification) {
          notification.items = {}
          notification.items.nestedNotification = notification;
          return true;
        });
        Bugsnag.notify("This is the message");
        var payload = deliverStub.firstCall.thisValue.serializePayload();
        var payloadObject = JSON.parse(payload)
        payloadObject.items.nestedNotification.should.equal("[RECURSIVE]");
    });

    it("should handle identical sibling fields in the payload", function() {
        Bugsnag.onBeforeNotify(function(notification) {
          var obj = { foo: 'bar' };
          notification.items = { a: obj, b: obj };
          return true;
        });
        Bugsnag.notify("This is the message");
        var payload = deliverStub.firstCall.thisValue.serializePayload();
        var payloadObject = JSON.parse(payload)
        payloadObject.items.a.foo.should.equal('bar');
        payloadObject.items.b.foo.should.equal('bar');
    });

    describe("severity", function() {
        it("should have a default severity", function() {
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].severity.should.equal("warning");
        });

        it("should send a severity when passed as option to notify", function() {
            Bugsnag.notify("This is the message", {
                severity: "info"
            });
            deliverStub.firstCall.thisValue.events[0].severity.should.equal("info");
        });
    });

    describe("userId", function() {
        it("should send a userId when passed as option to notify", function() {
            Bugsnag.notify("This is the message", {
                userId: "TempId"
            });
            deliverStub.firstCall.thisValue.events[0].user.id.should.equal("TempId");
        });
    });

    describe("context", function() {
        it("should send a context when passed as option to notify", function() {
            Bugsnag.notify("This is the message", {
                context: "TempContext"
            });
            deliverStub.firstCall.thisValue.events[0].context.should.equal("TempContext");
        });
    });

    describe("hostname", function() {
        it("should send the hostname", function() {
            Bugsnag.notify("Foo");
            deliverStub.firstCall.thisValue.events[0].device.hostname.should.equal(require('os').hostname());
        });
    });

    describe("groupingHash", function() {
        it("should send an groupingHash when passed as option to notify", function() {
            Bugsnag.notify("This is the message", {
                groupingHash: "groupingHashHere"
            });
            deliverStub.firstCall.thisValue.events[0].groupingHash.should.equal("groupingHashHere");
        });
    });

    describe("appVersion", function() {
        it("should send an appVersion when configured on Bugsnag", function() {
            Bugsnag.configure({
                appVersion: "BugsnagVersion"
            });
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].app.version.should.equal("BugsnagVersion");
        });
    });

    describe("appType", function() {
        it("should send an appType when configured on Bugsnag", function() {
            Bugsnag.configure({
                appType: "worker"
            });
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].app.type.should.equal("worker");
        });
    });

    describe("releaseStage", function() {
        it("shouldnt send a notification when releaseStage isnt configured in notifyReleaseStages", function() {
            Bugsnag.configure({
                releaseStage: "test"
            });
            Bugsnag.configure({
                notifyReleaseStages: ["production"]
            });
            Bugsnag.notify("This is the message");
            deliverStub.called.should.equal(false);
        });

        it("should allow you to change the releaseStage", function() {
            Bugsnag.configure({
                notifyReleaseStages: ["production"],
                releaseStage: "production"
            });
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].app.releaseStage.should.equal("production");
        });
    });

    describe("exceptions", function() {
        it("should only have a single well formatted exception", function() {
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].exceptions.length.should.equal(1);
            deliverStub.firstCall.thisValue.events[0].exceptions[0].should.have.keys("errorClass", "message", "stacktrace");
        });

        it("should set errorClass and message properly", function() {
            Bugsnag.notify("This is the message", {
                errorName: "BigBadError"
            });
            deliverStub.firstCall.thisValue.events[0].exceptions[0].errorClass.should.equal("BigBadError");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].message.should.equal("This is the message");
        });

        it("should have a proper stacktrace", function() {
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace.should.be.an("array");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace.should.have.length.of.at.least(2);
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].should.have.keys("file", "lineNumber", "columnNumber", "method", "path");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].file.should.contain(path.sep + "error.js");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].lineNumber.should.be.an("number");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].columnNumber.should.be.an("number");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].method.should.equal("Error");
        });

        it("should set projectRoot according to configuration", function() {
            Bugsnag.configure({
                projectRoot: __dirname
            });
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].should.not.have.property("inProject");
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[4].should.have.property("inProject", true);
        });
    });

    describe("metaData", function() {
        it("should allow configured metadata on Bugsnag object", function() {
            Bugsnag.metaData = {
                key: "value"
            };
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key");
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value");
            Bugsnag.metaData = null;
        });

        it("should allow configured metadata on Bugsnag notify", function() {
            Bugsnag.notify("This is the message", {
                key: "value"
            });
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key");
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value");
        });

        it("should merge metadata on Bugsnag notify", function() {
            Bugsnag.metaData = {
                key: "value"
            };
            Bugsnag.notify("This is the message", {
                key1: "value1"
            });
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key", "key1");
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value");
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key1", "value1");
            Bugsnag.metaData = null;
        });

        it("should overwrite metadata on clashing Bugsnag notify", function() {
            Bugsnag.metaData = {
                key: "value"
            };
            Bugsnag.notify("This is the message", {
                key: "value1"
            });
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key");
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value1");
            Bugsnag.metaData = null;
        });
    });

    describe("beforeNotifyCallbacks", function () {
        it("should allow overwriting of meta-data in beforeNotify", function () {
            Bugsnag.metaData = {
                key: "value"
            };
            Bugsnag.onBeforeNotify(function (notification) {
                var event = notification.events[0];
                event.metaData.key += "2";
            });

            Bugsnag.notify("this is an outrage");

            deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key");
            deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value2");

            Configuration.beforeNotifyCallbacks = [];
        });

        it("should allow ignoring of errors", function () {
            Bugsnag.onBeforeNotify(function (notification) {
                return false;
            });

            Bugsnag.notify("this is an outrage");

            deliverStub.calledOnce.should.equal(false);

            Configuration.beforeNotifyCallbacks = [];
        });

        it("should allow introspecting the original error object", function () {
            function SpecialError(message) {
              this.name = "SpecialError";
              this.message = message;
              this.customInfo = {times: "three"};
            }
            SpecialError.prototype = Object.create(Error.prototype);

            var error = new SpecialError("there is a glitch");
            Bugsnag.onBeforeNotify(function (notification, error) {
              notification.events[0].metaData.customInfo = error.customInfo;
            });
            Bugsnag.notify(error);
            deliverStub.firstCall.thisValue.events[0].metaData.customInfo.should.have.property("times", "three");

            Configuration.beforeNotifyCallbacks = [];
        });

        it("should not be able to modify handledState", function () {
            Bugsnag.onBeforeNotify(function (notification, error) {
                notification.events[0].unhandled = true;
                notification.events[0].severityReason = { something: "else" };
            });
            Bugsnag.notify(new Error('breaky'));
            deliverStub.firstCall.thisValue.events[0].unhandled.should.equal(false);
            deliverStub.firstCall.thisValue.events[0].severityReason.should.eql({ type: 'handledException' });
        });

        it("should cause severityReason = { type: 'userCallbackSetSeverity' } if any callback changes severity", function () {
          Bugsnag.onBeforeNotify(function (notification, error) {
              notification.events[0].severity = "error";
          });
          Bugsnag.notify(new Error('breaky'));
          deliverStub.firstCall.thisValue.events[0].severityReason.should.eql({ type: 'userCallbackSetSeverity' });
        })
    });

    describe("autoNotify", function() {
        it("should autoNotify with a default severity", function(done) {
            Bugsnag.autoNotify({}, function() {
                process.nextTick(function() {
                    var e;
                    try {
                        deliverStub.calledOnce.should.equal(true);
                        deliverStub.firstCall.thisValue.events[0].severity.should.equal("error");
                        done();
                    } catch (_error) {
                        e = _error;
                        done(e);
                    }
                });
                throw new Error();
            });
        });
    });

    describe("bad input", function() {
        it("notify(err) should handle bad input", function () {
            should.not.throw(function () {
                Bugsnag.notify(null);
            });
            should.not.throw(function () {
                Bugsnag.notify(undefined);
            });
            should.not.throw(function () {
                Bugsnag.notify(0);
            });
            should.not.throw(function () {
                Bugsnag.notify([]);
            });
            should.not.throw(function () {
                Bugsnag.notify(new Date());
            });
            should.not.throw(function () {
                Bugsnag.notify(false);
            });
            should.not.throw(function () {
                Bugsnag.notify(true);
            });
        });
    });

    describe("dealing with process unhandled/uncaught events", function () {
        it("should automatically report process#uncaughtException events", function (done) {
            var p = child_process.fork(__dirname + "/lib/process-uncaught-exception.js");
            var deliverCalled = false;
            var payload;
            p.on("message", function (msg) {
                deliverCalled = msg.deliverCalled;
                payload = msg.payload;
            });
            p.on("exit", function (code) {
                try {
                  code.should.equal(1);
                  deliverCalled.should.equal(true);
                  var event = payload.events[0];
                  event.severity.should.equal("error");
                  event.unhandled.should.equal(true);
                  event.severityReason.should.eql({ type: "unhandledException" });
                  done();
                } catch (e) {
                  done(e);
                }
            });
        });

        it("should automatically report process#unhandledRejection events", function (done) {
            var p = child_process.fork(__dirname + "/lib/process-unhandled-rejection.js");
            var deliverCalled = false;
            var payload;
            p.on("message", function (msg) {
                deliverCalled = msg.deliverCalled;
                payload = msg.payload;
            });
            p.on("exit", function (code) {
                try {
                  code.should.equal(1);
                  deliverCalled.should.equal(true);
                  var event = payload.events[0];
                  event.severity.should.equal("error");
                  event.unhandled.should.equal(true);
                  event.severityReason.should.eql({ type: "unhandledPromiseRejection" });
                  done();
                } catch (e) {
                  done(e);
                }
            });
        });

        it("should support autoNotifyUnhandledRejection=false", function (done) {
            var p = child_process.fork(__dirname + "/lib/process-unhandled-rejection.js", { env: { NOTIFY_UNHANDLED_REJECTION: 'no' } });
            var deliverCalled = false;
            var payload;
            p.on("message", function (msg) {
                deliverCalled = msg.deliverCalled;
            });
            p.on("exit", function (code) {
                try {
                  code.should.equal(0);
                  deliverCalled.should.equal(false);
                  done();
                } catch (e) {
                  done(e);
                }
            });
        });
    });

    describe("handledState properties", function (done) {
      it("should not allow the user to set handledState properties", function (done) {
          Bugsnag.notify("this is an outrage", {
              severity: "info",
              unhandled: true,
              severityReason: { type: "naughty" }
          });
          var event = deliverStub.firstCall.thisValue.events[0];
          event.unhandled.should.equal(false);
          event.severity.should.equal("info");
          event.severityReason.should.eql({ type: "userSpecifiedSeverity" });
          done();
      });
    });

    describe("filters", function (done) {
      it("should filter metaData with keys matching default Configuration.filters", function (done) {
          Bugsnag.notify("uh oh", { account: { id: '123', password: "s0 s3cure"} });
          var payload = deliverStub.firstCall.thisValue.serializePayload();
          var payloadObject = JSON.parse(payload)
          payloadObject.events[0].metaData.account.password.should.equal('[FILTERED]')
          done();
      });

      it("should filter metaData with keys matching custom Configuration.filters", function (done) {
          Bugsnag.configure({ filters: [ 'flip' ]})
          Bugsnag.notify("uh oh", { abbc: { id: '123', flip: "112" } });
          var payload = deliverStub.firstCall.thisValue.serializePayload();
          var payloadObject = JSON.parse(payload)
          payloadObject.events[0].metaData.abbc.flip.should.equal('[FILTERED]')
          done();
      });

      it("should filter the request property", function (done) {
          Bugsnag.configure({ filters: [ 'Authorization' ]})
          Bugsnag.notify("uh oh", { req: { headers: { 'Authorization': 's0 s3cure', 'x-beep-boop': 100 } } });
          var payload = deliverStub.firstCall.thisValue.serializePayload();
          var payloadObject = JSON.parse(payload)
          payloadObject.events[0].request.headers['x-beep-boop'].should.equal(100)
          payloadObject.events[0].request.headers['Authorization'].should.equal('[FILTERED]')
          done();
      });
    });
});
