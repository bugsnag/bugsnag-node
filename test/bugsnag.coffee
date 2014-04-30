domain = require "domain"
should = require("chai").should()
sinon = require("sinon")

Bugsnag = require "../"
Notification = require "../lib/notification"

apiKey = null
deliverStub = null

before () ->
  apiKey = "71ab53572c7b45316fb894d496f2e11d"
  Bugsnag.register apiKey, notifyReleaseStages: ["production", "development"]

describe "Bugsnag", ->
  beforeEach () -> deliverStub = sinon.stub(Notification.prototype, "deliver")

  afterEach () -> Notification.prototype.deliver.restore()

  it "should call deliver when notifying a caught error", ->
    try
      throw new Error("This is the message")
    catch e
      Bugsnag.notify(e)

    deliverStub.calledOnce.should.equal true

  it "should call deliver when notifying an event emitter error", ->
    eventEmitter = new (require('events').EventEmitter)()
    eventEmitter.on "error", Bugsnag.notify
    eventEmitter.emit "error", "Something went wrong"

    deliverStub.calledOnce.should.equal true

  it "should call deliver when notifying with a domain, using event emitter", ->
    mainDomain = domain.create()
    mainDomain.on "error", Bugsnag.notify
    mainDomain.run ->
      eventEmitter = new (require('events').EventEmitter)()
      eventEmitter.emit "error", new Error("Something went wrong")

    deliverStub.calledOnce.should.equal true

describe "Bugsnag", ->
  describe "Notification.deliver", ->
    it "should call the callback after notifying bugsnag", (done) ->
      Bugsnag.notify("error message", done)

    it "should call callback when releaseStage isnt configured in notifyReleaseStages", (done) ->
      oldNotifyReleaseStagesValue = Bugsnag.notifyReleaseStages
      Bugsnag.notifyReleaseStages = ["production"]
      Bugsnag.notify("This is the message", done)
      Bugsnag.notifyReleaseStages = oldNotifyReleaseStagesValue
