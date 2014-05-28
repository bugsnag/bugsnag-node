domain = require "domain"
path = require "path"

Utils = require "./utils"
Logger = require "./logger"
Configuration = require "./configuration"
BugsnagError = require "./error"
Notification = require "./notification"

# Make sure we get all stack frames from thrown errors
Error.stackTraceLimit = Infinity

module.exports = class Bugsnag
  unCaughtErrorHandlerAdded = false

  # This allows people to directly play with metadata, without knowledge of Configuration
  Object.defineProperty @, 'metaData',
    get: -> Configuration.metaData
    set: (metaData) -> Configuration.metaData = metaData

  # Register sets api key and also will configure bugsnag based on options
  @register: (apiKey, options = {}) =>
    Configuration.apiKey = apiKey
    @configure options

    Configuration.logger.info "Registered with apiKey #{apiKey}"

  # Configure bugsnag using the provided options
  @configure: (options) =>
    Configuration.configure options

    # If we should auto notify we also configure the uncaught exception handler, we can't do this
    # by default as it changes the way the app responds by removing the default handler.
    if Configuration.autoNotifyUncaught && !unCaughtErrorHandlerAdded
      unCaughtErrorHandlerAdded = true
      Configuration.logger.info "Configuring uncaughtExceptionHandler"
      process.on "uncaughtException", (err) =>
        @notify err, {severity: "error"}, autoNotifyCallback(err, true)

  # Only error is required, and that can be a string or error object
  @notify: (error, options, cb) ->
    if Utils.typeOf(options) == "function"
      cb = options
      options = {}

    options ||= {}

    unless shouldNotify()
      cb() if cb
      return

    Configuration.logger.info "Notifying Bugsnag of exception...\n#{error?.stack || error}"
    bugsnagErrors = BugsnagError.buildErrors(error, options.errorName)

    delete options.errorName

    notification = new Notification(bugsnagErrors, options)
    notification.deliver cb

  # The error handler express/connect middleware. Performs a notify
  @errorHandler: (err, req, res, next) =>
    Configuration.logger.info "Handling express error: #{err.stack || err}"
    @notify err, {req: req, severity: "error"}, autoNotifyCallback(err)
    next err

  # The request middleware for express/connect. Ensures next(err) is called when there is an error, and
  # tracks the request for manual notifies.
  @requestHandler: (req, res, next) ->
    dom = domain.create()
    dom._bugsnagOptions =
      req: req
    dom.on 'error', next
    dom.run next

  @restifyHandler: (req, res, route, err) =>
    @notify err, {req: req, severity: "error"}, autoNotifyCallback(err)

  # Intercepts the first argument from a callback and interprets it at as error.
  # if the error is not null it notifies bugsnag and doesn't call the callback
  @intercept: (cb) =>
    cb = (->) unless cb
    if process.domain
      return process.domain.intercept cb
    else
      return (err, args...) =>
        if err && (err instanceof Error)
          return @notify err, {severity: "error"}, autoNotifyCallback(err)
        cb(args...) if cb

  # Automatically notifies of uncaught exceptions in the callback and error
  # event emitters. Returns an event emitter, you can hook into .on("error") if
  # you want to.
  @autoNotify: (options, cb) =>
    if Utils.typeOf(options) == "function"
      cb = options
      options = {}

    dom = domain.create()
    dom._bugsnagOptions = options
    options["severity"] = "error"

    dom.on 'error', (err) =>
      # console.dir options
      @notify err, options, autoNotifyCallback(err)

    process.nextTick ->
      dom.run cb

    return dom

  shouldNotify = ->
    ( Configuration.notifyReleaseStages == null || Configuration.notifyReleaseStages.indexOf(Configuration.releaseStage) != -1 ) && Configuration.apiKey

  autoNotifyCallback = (notifiedError, uncaughtError = notifiedError.domain) ->
    (error) ->
      Configuration.logger.error "Bugsnag: error notifying bugsnag.com - #{error}" if error
      Configuration.onUncaughtError(notifiedError) if Configuration.onUncaughtError && uncaughtError
