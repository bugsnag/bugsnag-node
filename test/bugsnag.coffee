should = require("chai").should()
sinon = require("sinon")

Bugsnag = require "../"
Notification = require "../lib/notification"

apiKey = null
deliverStub = null

before () ->
	apiKey = "71ab53572c7b45316fb894d446f2e11d"
	Bugsnag.register apiKey
	deliverStub = sinon.stub(Notification.prototype, "deliver")

afterEach () -> deliverStub.reset()

describe "Bugsnag", ->
	describe "Notification", ->
		it "should call notify once", ->
			Bugsnag.notify("BigBadError", "This is the message")

			deliverStub.calledOnce.should.equal true

		it "should have the correct notification format", ->
			Bugsnag.notify("BigBadError", "This is the message")

			deliverStub.firstCall.thisValue.should.be.an("object")
			deliverStub.firstCall.thisValue.should.have.keys(["apiKey", "notifier", "events"])

		it "should identify the notifier properly", ->
			Bugsnag.notify("BigBadError", "This is the message")

			deliverStub.firstCall.thisValue.notifier.should.be.an("object")
			deliverStub.firstCall.thisValue.notifier.should.have.keys(["name", "version", "url"])
			deliverStub.firstCall.thisValue.notifier.should.have.property("name", "Bugsnag Node Notifier")
			deliverStub.firstCall.thisValue.notifier.should.have.property("version", "0.2.0")
			deliverStub.firstCall.thisValue.notifier.should.have.property("url", "https://github.com/bugsnag/bugsnag-node")

		it "should contain the APIKey", ->
			Bugsnag.notify("BigBadError", "This is the message")

			deliverStub.firstCall.thisValue.apiKey.should.equal apiKey