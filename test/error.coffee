path = require("path")
should = require("chai").should()
sinon = require("sinon")

Bugsnag = require "../"
BugsnagError = require "../lib/error"

apiKey = null
deliverStub = null

before () ->
  apiKey = "71ab53572c7b45316fb894d446f2e11d"
  Bugsnag.register apiKey, notifyReleaseStages: ["production", "development"]

beforeEach ->
  Bugsnag.configure notifyReleaseStages: ["production", "development"]

describe "Error", ->
  it "should have one error", ->
    error = new Error("error")
    errors = BugsnagError.buildErrors(error)

    errors.length.should.equal 1

  it "should support oath errors", ->
    error = new Error("error")
    error.oauthError = new Error("oauth error")
    errors = BugsnagError.buildErrors(error)

    errors.length.should.equal 2
