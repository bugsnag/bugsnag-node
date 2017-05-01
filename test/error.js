"use strict";

var path = require("path"),
    should = require("chai").should(),
    sinon = require("sinon"),
    Bugsnag = require("../"),
    BugsnagError = require("../lib/error"),
    apiKey = null,
    deliverStub = null;

before(function() {
  apiKey = "71ab53572c7b45316fb894d446f2e11d";
  return Bugsnag.register(apiKey, {
    notifyReleaseStages: ["production", "development"]
  });
});

beforeEach(function() {
  return Bugsnag.configure({
    notifyReleaseStages: ["production", "development"]
  });
});

describe("Error", function() {
  it("should have one error", function() {
    var error, errors;
    error = new Error("error");
    errors = BugsnagError.buildErrors(error);

    return errors.length.should.equal(1);
  });

  it("should support oath errors", function() {
    var error, errors;
    error = new Error("error");
    error.oauthError = new Error("oauth error");
    errors = BugsnagError.buildErrors(error);

    return errors.length.should.equal(2);
  });
});
