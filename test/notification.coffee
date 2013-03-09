should = require("chai").should()
sinon = require("sinon")

Bugsnag = require "../"
Notification = require "../lib/notification"

apiKey = null
deliverStub = null

before () ->
	apiKey = "71ab53572c7b45316fb894d446f2e11d"
	Bugsnag.register apiKey, notifyReleaseStages: ["production", "development"]

describe "Notification", ->
	beforeEach () -> deliverStub = sinon.stub(Notification.prototype, "deliver")

	afterEach () -> Notification.prototype.deliver.restore()

	it "should call deliver once", ->
		Bugsnag.notify("This is the message", "BigBadError")

		deliverStub.calledOnce.should.equal true

	it "should have the correct notification format", ->
		Bugsnag.notify("This is the message", "BigBadError")

		deliverStub.firstCall.thisValue.should.be.an("object")
		deliverStub.firstCall.thisValue.should.have.keys(["apiKey", "notifier", "events"])

	it "should identify the notifier properly", ->
		Bugsnag.notify("This is the message", "BigBadError")

		deliverStub.firstCall.thisValue.notifier.should.be.an("object")
		deliverStub.firstCall.thisValue.notifier.should.have.keys(["name", "version", "url"])
		deliverStub.firstCall.thisValue.notifier.should.have.property("name", "Bugsnag Node Notifier")
		deliverStub.firstCall.thisValue.notifier.should.have.property("version", "1.0.0")
		deliverStub.firstCall.thisValue.notifier.should.have.property("url", "https://github.com/bugsnag/bugsnag-node")

	it "should contain the APIKey", ->
		Bugsnag.notify("This is the message", "BigBadError")

		deliverStub.firstCall.thisValue.apiKey.should.equal apiKey

	it "should contain an event", ->
		Bugsnag.notify("This is the message", "BigBadError")

		deliverStub.firstCall.thisValue.events.length.should.equal 1
		deliverStub.firstCall.thisValue.events[0].should.have.keys("releaseStage", "exceptions")

	describe "userId", ->
		it "should send a userId when configured on Bugsnag", ->
			Bugsnag.userId = "TemporaryUserId"
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].userId.should.equal "TemporaryUserId"

			Bugsnag.userId = null

		it "should send a userId when passed as option to notify", ->
			Bugsnag.notify("BigBadError", "This is the message", userId: "TempId")

			deliverStub.firstCall.thisValue.events[0].userId.should.equal "TempId"

		it "should overwrite a userId when passed as option to notify", ->
			Bugsnag.userId = "TemporaryUserId"
			Bugsnag.notify("BigBadError", "This is the message", userId: "TempId")

			deliverStub.firstCall.thisValue.events[0].userId.should.equal "TempId"

			Bugsnag.userId = null

	describe "context", ->
		it "should send a context when configured on Bugsnag", ->
			Bugsnag.context = "TemporaryContext"
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].context.should.equal "TemporaryContext"

			Bugsnag.context = null

		it "should send a context when passed as option to notify", ->
			Bugsnag.notify("BigBadError", "This is the message", context: "TempContext")

			deliverStub.firstCall.thisValue.events[0].context.should.equal "TempContext"

		it "should overwrite a context when passed as option to notify", ->
			Bugsnag.context = "TemporaryContext"
			Bugsnag.notify("BigBadError", "This is the message", context: "TempContext")

			deliverStub.firstCall.thisValue.events[0].context.should.equal "TempContext"

			Bugsnag.context = null

	describe "appVersion", ->
		it "should send an appVersion when configured on Bugsnag", ->
			Bugsnag.appVersion = "BugsnagVersion"
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].appVersion.should.equal "BugsnagVersion"

			Bugsnag.appVersion = null

	describe "releaseStage", ->
		it "shouldnt send a notification when releaseStage isnt configured in notifyReleaseStages", ->
			oldNotifyReleaseStagesValue = Bugsnag.notifyReleaseStages
			Bugsnag.notifyReleaseStages = ["production"]
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.called.should.equal false
			Bugsnag.notifyReleaseStages = oldNotifyReleaseStagesValue

		it "should allow you to change the releaseStage", ->
			oldReleaseStage = Bugsnag.releaseStage
			oldNotifyReleaseStagesValue = Bugsnag.notifyReleaseStages
			Bugsnag.notifyReleaseStages = ["production"]
			Bugsnag.releaseStage = "production"
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].releaseStage.should.equal "production"

			Bugsnag.notifyReleaseStages = oldNotifyReleaseStagesValue	
			Bugsnag.releaseStage = oldReleaseStage

	describe "osVersion", ->
		it "should allow you to set the osVersion", ->
			Bugsnag.osVersion = "BugsnagOSVersion"
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].osVersion.should.equal "BugsnagOSVersion"

			Bugsnag.osVersion = null

	describe "exceptions", ->
		it "should only have a single well formatted exception", ->
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].exceptions.length.should.equal 1
			deliverStub.firstCall.thisValue.events[0].exceptions[0].should.have.keys("errorClass", "message", "stacktrace")

		it "should set errorClass and message properly", ->
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].exceptions[0].errorClass.should.equal "BigBadError"
			deliverStub.firstCall.thisValue.events[0].exceptions[0].message.should.equal "This is the message"

		it "should have a proper stacktrace", ->
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace.should.be.an("array")
			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace.should.have.length.of.at.least 2
			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].should.have.keys("file", "lineNumber", "columnNumber", "method")
			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].file.should.contain "/error.js"
			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].lineNumber.should.be.an "number"
			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].columnNumber.should.be.an "number"
			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].method.should.equal "Error"

		it "should set projectRoot according to configuration", ->
			oldValue = Bugsnag.projectRoot
			Bugsnag.projectRoot = __dirname
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].should.not.have.property("inProject")
			deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[2].should.have.property("inProject", true)

			Bugsnag.projectRoot = oldValue

	describe "metaData", ->
		it "should allow configured metadata on Bugsnag object", ->
			Bugsnag.metaData =
				key: "value"
			
			Bugsnag.notify("This is the message", "BigBadError")

			deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key")
			deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value")

			Bugsnag.metaData = null

		it "should allow configured metadata on Bugsnag notify", ->
			Bugsnag.notify("This is the message", "BigBadError", key: "value")

			deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key")
			deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value")

		it "should merge metadata on Bugsnag notify", ->
			Bugsnag.metaData =
				key: "value"

			Bugsnag.notify("This is the message", "BigBadError", key1: "value1")

			deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key", "key1")
			deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value")
			deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key1", "value1")

			Bugsnag.metaData = null

		it "should overwrite metadata on clashing Bugsnag notify", ->
			Bugsnag.metaData =
				key: "value"

			Bugsnag.notify("This is the message", "BigBadError", key: "value1")

			deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key")
			deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value1")

			Bugsnag.metaData = null