'use strict'

const proxyquire = require('proxyquire').noCallThru().noPreserveCache()

const Emitter = require('events')

describe('session delegate', () => {
  it('should', done => {
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
      logger: { info: () => {} },
      sessionEndpoint: 'blah'
    }).startSession({})
  })
})
