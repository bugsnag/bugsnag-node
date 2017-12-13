'use strict'

const cuid = require('cuid')

module.exports = class Session {
  constructor () {
    this.id = cuid()
    this.startedAt = new Date()
    this._handled = 0
    this._unhandled = 0
  }
  toJSON () {
    return {
      id: this.id,
      startedAt: this.startedAt.toISOString(),
      events: { handled: this._handled, unhandled: this._unhandled }
    }
  }
  trackError (report) {
    this[report._handledState.unhandled ? '_unhandled' : '_handled'] += 1
  }
}
