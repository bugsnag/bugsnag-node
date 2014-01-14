module.exports = class Logger
  LOG_PREFIX = "Bugsnag"

  constructor: (@logLevel = "error") ->

  info: (output...) =>
    try
      console.log "#{LOG_PREFIX}: ", output... if @logLevel == "info"
    catch e

  warn: (output...) =>
    try
      console.log "#{LOG_PREFIX}: ", output... if @logLevel == "warn" || @logLevel == "info"
    catch e

  error: (output...) =>
    try
      console.error "#{LOG_PREFIX}: ", output... if @logLevel?
    catch e

