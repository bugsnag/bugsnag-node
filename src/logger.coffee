module.exports = class Logger
  LOG_PREFIX = "Bugsnag"

  constructor: (@logLevel = "error") ->

  info: (output...) =>
    console.log "#{LOG_PREFIX}: ", output... if @logLevel == "info"

  warn: (output...) =>
    console.log "#{LOG_PREFIX}: ", output... if @logLevel == "warn" || @logLevel == "log"

  error: (output...) =>
    console.error "#{LOG_PREFIX}: ", output... if @logLevel?