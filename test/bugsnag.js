"use strict";

var domain = require("domain"),
    should = require("chai").should(),
    sinon = require("sinon"),
    Bugsnag = require("../"),
    Notification = require("../lib/notification"),
    apiKey = null,
    deliverStub = null;

before(function() {
    apiKey = "71ab53572c7b45316fb894d496f2e11d";
    return Bugsnag.register(apiKey, {
        notifyReleaseStages: ["production", "development"]
    });
});

describe("Bugsnag", function() {

    beforeEach(function() {
        deliverStub = sinon.stub(Notification.prototype, "deliver");
        sinon.stub(Notification.prototype, "loadCode").callsArg(0);
    });

    afterEach(function() {
        Notification.prototype.deliver.restore();
        Notification.prototype.loadCode.restore();
    });

    it("should call deliver when notifying a caught error", function() {
        var e;
        try {
            throw new Error("This is the message");
        } catch (_error) {
            e = _error;
            Bugsnag.notify(e);
        }
        return deliverStub.calledOnce.should.equal(true);
    });

    it("should call deliver when notifying an event emitter error", function() {
        var eventEmitter = new (require('events').EventEmitter)();
        eventEmitter.on("error", Bugsnag.notify);
        eventEmitter.emit("error", "Something went wrong");
        deliverStub.calledOnce.should.equal(true);
    });

    it("should call deliver when notifying with a domain, using event emitter", function() {
        var mainDomain;
        mainDomain = domain.create();
        mainDomain.on("error", Bugsnag.notify);
        mainDomain.run(function() {
            var eventEmitter = new (require('events').EventEmitter)();
            eventEmitter.emit("error", new Error("Something went wrong"));
        });
        deliverStub.calledOnce.should.equal(true);
    });

    it("should expose requestData when inside a domain and using user.id", function () {
        var mainDomain;
        mainDomain = domain.create();
        mainDomain.on("error", Bugsnag.notify);
        mainDomain.run(function() {
            Bugsnag.requestData = {user: {id: 5}};
            var eventEmitter = new (require('events').EventEmitter)();
            eventEmitter.emit("error", new Error("Something went wrong"));
        });
        deliverStub.calledOnce.should.equal(true);
        deliverStub.firstCall.thisValue.events[0].user.id.should.equal(5);
    });

    it("should expose requestData when inside a domain using userId", function () {
        var mainDomain;
        mainDomain = domain.create();
        mainDomain.on("error", Bugsnag.notify);
        mainDomain.run(function() {
            Bugsnag.requestData = {userId: 5};
            var eventEmitter = new (require('events').EventEmitter)();
            eventEmitter.emit("error", new Error("Something went wrong"));
        });
        deliverStub.calledOnce.should.equal(true);
        deliverStub.firstCall.thisValue.events[0].user.id.should.equal(5);
    });
});

describe("Bugsnag", function() {

    describe("Notification.deliver", function() {
        it("should call the callback after notifying bugsnag", function(done) {
            Bugsnag.notify("error message", done);
        });

        it("should call callback when releaseStage isnt configured in notifyReleaseStages", function(done) {

            var oldNotifyReleaseStagesValue;
            oldNotifyReleaseStagesValue = Bugsnag.notifyReleaseStages;
            Bugsnag.notifyReleaseStages = ["production"];
            Bugsnag.notify("This is the message", done);
            Bugsnag.notifyReleaseStages = oldNotifyReleaseStagesValue;
        });
    });
});

require("./sessions/session");
require("./sessions/tracker");
require("./sessions/delegate");
