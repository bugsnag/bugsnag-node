path = require("path")
should = require("chai").should()
sinon = require("sinon")

Bugsnag = require "../"
Notification = require "../lib/notification"

apiKey = null
deliverStub = null

before () ->
  apiKey = "71ab53572c7b45316fb894d446f2e11d"
  Bugsnag.register apiKey, notifyReleaseStages: ["production", "development"]

beforeEach ->
  Bugsnag.configure notifyReleaseStages: ["production", "development"]

describe "Notification", ->
  beforeEach () -> deliverStub = sinon.stub(Notification.prototype, "deliver")

  afterEach () -> Notification.prototype.deliver.restore()

  it "should call deliver once", ->
    Bugsnag.notify("This is the message")

    deliverStub.calledOnce.should.equal true

  it "should have the correct notification format", ->
    Bugsnag.notify("This is the message")

    deliverStub.firstCall.thisValue.should.be.an("object")
    deliverStub.firstCall.thisValue.should.have.keys(["apiKey", "notifier", "events"])

  it "should identify the notifier properly", ->
    Bugsnag.notify("This is the message")

    deliverStub.firstCall.thisValue.notifier.should.be.an("object")
    deliverStub.firstCall.thisValue.notifier.should.have.keys(["name", "version", "url"])
    deliverStub.firstCall.thisValue.notifier.should.have.property("name", "Bugsnag Node Notifier")
    deliverStub.firstCall.thisValue.notifier.should.have.property("version", require("../package.json").version)
    deliverStub.firstCall.thisValue.notifier.should.have.property("url", "https://github.com/bugsnag/bugsnag-node")

  it "should contain the APIKey", ->
    Bugsnag.notify("This is the message")

    deliverStub.firstCall.thisValue.apiKey.should.equal apiKey

  it "should contain an event", ->
    Bugsnag.notify("This is the message")

    deliverStub.firstCall.thisValue.events.length.should.equal 1
    deliverStub.firstCall.thisValue.events[0].should.have.keys("releaseStage", "exceptions", "device", "payloadVersion", "severity")

  describe "payloadVersion", ->
    it "should have a payloadVersion", ->
      Bugsnag.notify("This is the message")

      deliverStub.firstCall.thisValue.events[0].payloadVersion.should.equal "2"

  describe "severity", ->
    it "should have a default severity", ->
      Bugsnag.notify("This is the message")

      deliverStub.firstCall.thisValue.events[0].severity.should.equal "warning"

    it "should send a severity when passed as option to notify", ->
      Bugsnag.notify("This is the message", severity: "info")

      deliverStub.firstCall.thisValue.events[0].severity.should.equal "info"

  describe "userId", ->
    it "should send a userId when passed as option to notify", ->
      Bugsnag.notify("This is the message", userId: "TempId")

      deliverStub.firstCall.thisValue.events[0].userId.should.equal "TempId"

  describe "context", ->
    it "should send a context when passed as option to notify", ->
      Bugsnag.notify("This is the message", context: "TempContext")

      deliverStub.firstCall.thisValue.events[0].context.should.equal "TempContext"

  describe "hostname", ->
    it "should send the hostname", ->
      Bugsnag.notify("Foo")
      deliverStub.firstCall.thisValue.events[0].device.hostname.should.equal require('os').hostname()

  describe "groupingHash", ->
    it "should send an groupingHash when passed as option to notify", ->
      Bugsnag.notify("This is the message", groupingHash: "groupingHashHere")

      deliverStub.firstCall.thisValue.events[0].groupingHash.should.equal "groupingHashHere"

  describe "appVersion", ->
    it "should send an appVersion when configured on Bugsnag", ->
      Bugsnag.configure appVersion: "BugsnagVersion"
      Bugsnag.notify("This is the message")

      deliverStub.firstCall.thisValue.events[0].appVersion.should.equal "BugsnagVersion"

  describe "releaseStage", ->
    it "shouldnt send a notification when releaseStage isnt configured in notifyReleaseStages", ->
      Bugsnag.configure releaseStage: "test"
      Bugsnag.configure notifyReleaseStages: ["production"]
      Bugsnag.notify("This is the message")

      deliverStub.called.should.equal false

    it "should allow you to change the releaseStage", ->
      Bugsnag.configure notifyReleaseStages: ["production"], releaseStage: "production"
      Bugsnag.notify("This is the message")

      deliverStub.firstCall.thisValue.events[0].releaseStage.should.equal "production"

  describe "exceptions", ->
    it "should only have a single well formatted exception", ->
      Bugsnag.notify("This is the message")

      deliverStub.firstCall.thisValue.events[0].exceptions.length.should.equal 1
      deliverStub.firstCall.thisValue.events[0].exceptions[0].should.have.keys("errorClass", "message", "stacktrace")

    it "should set errorClass and message properly", ->
      Bugsnag.notify("This is the message", errorName: "BigBadError")

      deliverStub.firstCall.thisValue.events[0].exceptions[0].errorClass.should.equal "BigBadError"
      deliverStub.firstCall.thisValue.events[0].exceptions[0].message.should.equal "This is the message"

    it "should have a proper stacktrace", ->
      Bugsnag.notify("This is the message")

      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace.should.be.an("array")
      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace.should.have.length.of.at.least 2
      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].should.have.keys("file", "lineNumber", "columnNumber", "method")
      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].file.should.contain path.sep + "error.js"
      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].lineNumber.should.be.an "number"
      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].columnNumber.should.be.an "number"
      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].method.should.equal "Error"

    it "should set projectRoot according to configuration", ->
      Bugsnag.configure projectRoot: __dirname
      Bugsnag.notify("This is the message")

      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[0].should.not.have.property("inProject")
      deliverStub.firstCall.thisValue.events[0].exceptions[0].stacktrace[3].should.have.property("inProject", true)

  describe "metaData", ->
    it "should allow configured metadata on Bugsnag object", ->
      Bugsnag.metaData =
        key: "value"

      Bugsnag.notify("This is the message")

      deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key")
      deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value")

      Bugsnag.metaData = null

    it "should allow configured metadata on Bugsnag notify", ->
      Bugsnag.notify("This is the message", key: "value")

      deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key")
      deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value")

    it "should merge metadata on Bugsnag notify", ->
      Bugsnag.metaData =
        key: "value"

      Bugsnag.notify("This is the message", key1: "value1")

      deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key", "key1")
      deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value")
      deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key1", "value1")

      Bugsnag.metaData = null

    it "should overwrite metadata on clashing Bugsnag notify", ->
      Bugsnag.metaData =
        key: "value"

      Bugsnag.notify("This is the message", key: "value1")

      deliverStub.firstCall.thisValue.events[0].metaData.should.have.keys("key")
      deliverStub.firstCall.thisValue.events[0].metaData.should.have.property("key", "value1")

      Bugsnag.metaData = null

  describe "autoNotify", ->
    it "should autoNotify with a default severity", (done) ->
      Bugsnag.autoNotify {}, ->
        process.nextTick ->
          try
            deliverStub.calledOnce.should.equal true
            deliverStub.firstCall.thisValue.events[0].severity.should.equal "error"
            done()
          catch e
            done(e)
        throw new Error()
