"use strict";

var path = require("path"),
    should = require("chai").should(),
    sinon = require("sinon"),
    Bugsnag = require("../"),
    Configuration = require("../lib/configuration"),
    Notification = require("../lib/notification"),
    request = require("request"),
    apiKey = null,
    deliverStub = null;

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
        Notification.prototype.loadCode.restore();
    });

    it("should call deliver once", function() {
        Bugsnag.notify("This is the message");
        deliverStub.calledOnce.should.equal(true);
    });

    it("should have the correct notification format", function() {
        Bugsnag.notify("This is the message");
        deliverStub.firstCall.thisValue.should.be.an("object");
        deliverStub.firstCall.thisValue.should.have.keys(["apiKey", "notifier", "events"]);
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
        deliverStub.firstCall.thisValue.events[0].should.have.keys("releaseStage", "exceptions", "device", "payloadVersion", "severity", "metaData");
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

    describe("payloadVersion", function() {
        it("should have a payloadVersion", function() {
            Bugsnag.notify("This is the message");
            deliverStub.firstCall.thisValue.events[0].payloadVersion.should.equal("2");
        });
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
            deliverStub.firstCall.thisValue.events[0].appVersion.should.equal("BugsnagVersion");
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
            deliverStub.firstCall.thisValue.events[0].releaseStage.should.equal("production");
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
            deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[3].should.have.property("inProject", true);
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
});
