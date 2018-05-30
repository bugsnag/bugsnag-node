const should = require('chai').should()
const sinon = require('sinon')

const MSG_DEPRECATED_ENDPOINT = 'The "useSSL", "notifyHost", "notifyPath" and "notifyPort" options are deprecated. Use the "endpoints" option to configure URLs'
const MSG_SESSION_ENDPOINT_MISSING = 'The session tracking endpoint has not been set. Session tracking is disabled'
const MSG_DEPRECATED_SESSION_ENDPOINT = 'The "sessionEndpoint" option is deprecated. Use the "endpoints" option to configure URLs'
const MSG_DEPRECATED_SESSION_TRACKING_ENABLED = 'The "sessionTrackingEnabled" option is deprecated. Use the "endpoints" option instead'

describe('configuration', function () {
  var Configuration
  beforeEach(function () {
    // ensure the configuration object is fresh for each test
    delete require.cache[require.resolve('../lib/configuration')]
    Configuration = require('../lib/configuration')
  })

  describe('endpoints', function () {
    it('should set the correct defaults if nothing is supplied', function () {
      Configuration.configure({})
      Configuration.endpoints.should.eql({
        notify: 'https://notify.bugsnag.com/',
        sessions: 'https://sessions.bugsnag.com/'
      })
      Configuration.autoCaptureSessions.should.equal(true)
    })

    it('should warn but work correctly if the deprecated option "useSSL" is used', function () {
      const errLogSpy = sinon.spy()
      Configuration.configure({
        useSSL: false,
        logger: { error: errLogSpy }
      })
      Configuration.endpoints.should.eql({
        notify: 'http://notify.bugsnag.com/',
        sessions: 'https://sessions.bugsnag.com/'
      })
      Configuration.autoCaptureSessions.should.equal(false)
      errLogSpy.calledTwice.should.equal(true)
      errLogSpy.args[0].should.eql([ MSG_DEPRECATED_ENDPOINT ])
      errLogSpy.args[1].should.eql([ MSG_SESSION_ENDPOINT_MISSING ])
    })

    it('should warn but work correctly if the deprecated option "notifyHost" is used', function () {
      const errLogSpy = sinon.spy()
      Configuration.configure({
        notifyHost: 'foo.bar.baz',
        logger: { error: errLogSpy }
      })
      Configuration.endpoints.should.eql({
        notify: 'https://foo.bar.baz/',
        sessions: 'https://sessions.bugsnag.com/'
      })
      Configuration.autoCaptureSessions.should.equal(false)
      errLogSpy.calledTwice.should.equal(true)
      errLogSpy.args[0].should.eql([ MSG_DEPRECATED_ENDPOINT ])
      errLogSpy.args[1].should.eql([ MSG_SESSION_ENDPOINT_MISSING ])
    })

    it('should warn but work correctly if the deprecated option "notifyPath" is used', function () {
      const errLogSpy = sinon.spy()
      Configuration.configure({
        notifyPath: 'jim',
        logger: { error: errLogSpy }
      })
      Configuration.endpoints.should.eql({
        notify: 'https://notify.bugsnag.com/jim',
        sessions: 'https://sessions.bugsnag.com/'
      })
      Configuration.autoCaptureSessions.should.equal(false)
      errLogSpy.calledTwice.should.equal(true)
      errLogSpy.args[0].should.eql([ MSG_DEPRECATED_ENDPOINT ])
      errLogSpy.args[1].should.eql([ MSG_SESSION_ENDPOINT_MISSING ])
    })

    it('should warn but work correctly if the deprecated option "notifyPort" is used', function () {
      const errLogSpy = sinon.spy()
      Configuration.configure({
        notifyPort: 1234,
        logger: { error: errLogSpy }
      })
      Configuration.endpoints.should.eql({
        notify: 'https://notify.bugsnag.com:1234/',
        sessions: 'https://sessions.bugsnag.com/'
      })
      Configuration.autoCaptureSessions.should.equal(false)
      errLogSpy.calledTwice.should.equal(true)
      errLogSpy.args[0].should.eql([ MSG_DEPRECATED_ENDPOINT ])
      errLogSpy.args[1].should.eql([ MSG_SESSION_ENDPOINT_MISSING ])
    })

    it('should warn but work correctly if the deprecated option "sessionEndpoint" is used', function () {
      const errLogSpy = sinon.spy()
      Configuration.configure({
        sessionEndpoint: 'https://sessions.custom.com/',
        logger: { error: errLogSpy }
      })
      Configuration.endpoints.should.eql({
        notify: 'https://notify.bugsnag.com/',
        sessions: 'https://sessions.custom.com/'
      })
      Configuration.autoCaptureSessions.should.equal(true)
      errLogSpy.calledOnce.should.equal(true)
      errLogSpy.args[0].should.eql([ MSG_DEPRECATED_SESSION_ENDPOINT ])
    })

    it('should warn but work correctly if the deprecated option "sessionTrackingEnabled" is used', function () {
      const errLogSpy = sinon.spy()
      Configuration.configure({
        sessionTrackingEnabled: false,
        logger: { error: errLogSpy }
      })
      Configuration.endpoints.should.eql({
        notify: 'https://notify.bugsnag.com/',
        sessions: 'https://sessions.bugsnag.com/'
      })
      Configuration.autoCaptureSessions.should.equal(false)
      errLogSpy.calledOnce.should.equal(true)
      errLogSpy.args[0].should.eql([ MSG_DEPRECATED_SESSION_TRACKING_ENABLED ])
    })

    it('should warn but work correctly if "endpoints.session" is missing', function () {
      const errLogSpy = sinon.spy()
      Configuration.configure({
        endpoints: { notify: 'https://notify.custom.com/' },
        logger: { error: errLogSpy }
      })
      Configuration.endpoints.should.eql({
        notify: 'https://notify.custom.com/'
      })
      Configuration.autoCaptureSessions.should.equal(false)
      errLogSpy.calledOnce.should.equal(true)
      errLogSpy.args[0].should.eql([ MSG_SESSION_ENDPOINT_MISSING ])
    })

    it('should throw an error if "endpoints.notify" is missing', function () {
      ;(function () {
        Configuration.configure({ endpoints: {} })
      }).should.throw(/The notify endpoint is not set/)
    })

    it('should throw an error if "endpoints" contains an unknown key', function () {
      ;(function () {
        Configuration.configure({ endpoints: { notify: 'https://notify.custom.com/', nope: 'nooo' } })
      }).should.throw(/Endpoints configuration contains unknown key "nope"/)
    })

    it('should throw an error if "autoCaptureSessions=true" and "endpoints.session" is missing', function () {
      ;(function () {
        Configuration.configure({ autoCaptureSessions: true, endpoints: { notify: 'https://notify.custom.com/' } })
      }).should.throw(/Session tracking is enabled but no session endpoint is set/)
    })
  })
})
