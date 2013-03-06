should = require("chai").should()
sinon = require("sinon")

Bugsnag = require "../src/bugsnag"
Notification = require "../src/notification"

Bugsnag.register "71ab53572c7b45316fb894d446f2e11d"

describe "Bugsnag", ->
	describe "notify", ->
		stub = sinon.stub(Notification.prototype, "deliver")

		Bugsnag.notify("BigBadError", "This is the message")

		stub.calledOnce.should.be true
		stub.firstCall.thisValue.should.be.an("object")
		stub.firstCall.thisValue.notifier.should.be.an("object")
		stub.firstCall.thisValue.notifier.name.should.equal("Bugsnag Node Notifier")