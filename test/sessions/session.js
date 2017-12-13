const Session = require('../../lib/sessions/session')

describe('session', () => {
  describe('toJSON()', () => {
    it('returns the correct data structure', () => {
      const s = new Session().toJSON()
      ;(typeof s.id).should.equal('string')
      ;(typeof s.startedAt).should.equal('string')
      s.events.should.eql({ handled: 0, unhandled: 0 })
    })
  })
  describe('trackError()', () => {
    it('counts handled/unhandled events', () => {
      const s = new Session()
      s.trackError({ _handledState: { unhandled: true } })
      s.trackError({ _handledState: { unhandled: false } })
      s.trackError({ _handledState: { unhandled: true } })
      s.trackError({ _handledState: { unhandled: true } })
      s.trackError({ _handledState: { unhandled: false } })
      s.toJSON().events.should.eql({ handled: 2, unhandled: 3 })
    })
  })
})
