const Session = require('./session')
const SessionTracker = require('./tracker')
const request = require('request')
const stringify = require('json-stringify-safe')
const notifier = require('../notifier')
const Utils = require('../utils')
const Backoff = require('backo')

module.exports = (Configuration) => {
  const shouldSend =
    Configuration.notifyReleaseStages === null ||
    Configuration.notifyReleaseStages.indexOf(Configuration.releaseStage) !== -1
  const sessions = new SessionTracker()
  sessions.on('summary', sendSessionSummary)
  sessions.start()

  function sendSessionSummary (sessions) {
    if (!sessions.length) return
    if (!shouldSend) {
      return Configuration.logger.warn("Current release stage prevented session report from being sent.")
    }

    const payload = {
      notifier: notifier,
      device: { hostname: Configuration.hostname },
      app: {
        version: Configuration.appVersion || undefined,
        type: Configuration.appType || undefined,
        releaseStage: Configuration.releaseStage || undefined
      },
      sessionCounts: sessions
    }

    Configuration.logger.info('Sending session', payload)
    const backoff = new Backoff({ min: 1000, max: 10000 })
    const maxAttempts = 10
    req(handleRes)

    function handleRes(err) {
      if (!err) return Configuration.logger.info('Session delivered')
      if (backoff.attempts === 10) {
        Configuration.logger.error('Session delivery failed, max retries exceeded', err)
        return
      }
      Configuration.logger.info('Session delivery failed, retry #' + (backoff.attempts + 1) + '/' + maxAttempts, err)
      setTimeout(function () {
        req(handleRes)
      }, backoff.duration())
    }

    function req (cb) {
      request({
        method: 'POST',
        url: Configuration.endpoints.sessions,
        proxy: Configuration.proxy,
        headers: Object.assign({}, Utils.cloneObject(Configuration.headers), {
          'Content-Type': 'application/json',
          'Bugsnag-Api-Key': Configuration.apiKey,
          'Bugsnag-Sent-At': new Date().toISOString(),
          'Bugsnag-Payload-Version': '1.0'
        }),
        body: stringify(payload, null, null, () => '[RECURSIVE]')
      }, cb)
    }
  }

  return {
    startSession: client => sessions.track(new Session())
  }
}
