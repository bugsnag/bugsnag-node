'use strict'

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()
const Emitter = require('events')

describe('session delegate', () => {
  it('should send the session report', done => {
    class TrackerMock extends Emitter {
      start () {
        this.emit('summary', [
          { startedAt: '2017-12-12T13:54:00.000Z', sessionsStarted: 123 }
        ])
      }
      stop () {}
      track () {}
    }
    const createSessionDelegate = proxyquire('../../lib/sessions', {
      './tracker': TrackerMock,
      'request': (opts) => {
        const body = JSON.parse(opts.body)
        body.sessionCounts.length.should.equal(1)
        body.sessionCounts[0].sessionsStarted.should.equal(123)
        done()
      }
    })
    createSessionDelegate({
      logger: { info: () => {}, warn: () => {} },
      endpoints: { sessions: 'blah' },
      notifyReleaseStages: null
    }).startSession({})
  })

  it('should not send the session report when releaseStage is not in notifyReleaseStages', done => {
    class TrackerMock extends Emitter {
      start () {
        this.emit('summary', [
          { startedAt: '2017-12-12T13:54:00.000Z', sessionsStarted: 123 }
        ])
      }
      stop () {}
      track () {}
    }
    const createSessionDelegate = proxyquire('../../lib/sessions', {
      './tracker': TrackerMock,
      'request': (opts) => {
        true.should.equal(false)
        done()
      }
    })
    createSessionDelegate({
      logger: {
        info: () => {},
        warn: (msg) => {
          msg.should.equal('Current release stage prevented session report from being sent.')
          setTimeout(done, 150)
        }
      },
      endpoints: { sessions: 'blah' },
      releaseStage: 'qa',
      notifyReleaseStages: [ 'production' ]
    }).startSession({})
  })

  it('should include the correct app and device payload properties', done => {
    class TrackerMock extends Emitter {
      start () {
        this.emit('summary', [
          { startedAt: '2017-12-12T13:54:00.000Z', sessionsStarted: 123 }
        ])
      }
      stop () {}
      track () {}
    }
    const createSessionDelegate = proxyquire('../../lib/sessions', {
      './tracker': TrackerMock,
      'request': (opts) => {
        const body = JSON.parse(opts.body)
        body.sessionCounts.length.should.equal(1)
        body.sessionCounts[0].sessionsStarted.should.equal(123)
        body.device.should.eql({
          hostname: 'test-machine.local'
        })
        body.app.should.eql({
          version: '1.2.3',
          releaseStage: 'qa',
          type: 'server'
        })
        done()
      }
    })
    createSessionDelegate({
      logger: { info: () => {}, warn: () => {} },
      endpoints: { sessions: 'blah' },
      notifyReleaseStages: null,
      releaseStage: 'qa',
      appType: 'server',
      appVersion: '1.2.3',
      hostname: 'test-machine.local'
    }).startSession({})
  })
})
