const Tracker = require('../../lib/sessions/tracker')
const Session = require('../../lib/sessions/session')
const timekeeper = require('timekeeper')
const should = require("chai").should()

describe('session tracker', function () {
  it('should track sessions and summarize per minute', function (done) {
    const startOfThisMin = new Date()
    startOfThisMin.setSeconds(0)
    startOfThisMin.setMilliseconds(0)

    timekeeper.travel(startOfThisMin)

    const t = new Tracker(50)
    t.start()
    t.track(new Session())
    t.track(new Session())
    t.track(new Session())
    t.track(new Session())

    timekeeper.travel(startOfThisMin.getTime() + (61 * 1000))

    t.on('summary', function (s) {
      s.length.should.equal(1)
      s[0].sessionsStarted.should.equal(4)
      s[0].startedAt.should.equal(startOfThisMin.toISOString())
      done()
    })
  })

  it('should only start one interval', function () {
    const t = new Tracker(5)
    t.start()
    const i0 = t._interval
    t.start()
    i0.should.equal(t._interval)
    t.stop()
    should.equal(t._interval, null)
  })

  afterEach(function () {
    timekeeper.reset()
  })
})
