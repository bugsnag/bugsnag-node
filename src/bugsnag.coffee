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
    if Configuration.autoNotifyUncaught
      Configuration.logger.info "Configuring uncaughtExceptionHandler"
      process.on "uncaughtException", (err) =>
        @notify err, (error, response) =>
          Configuration.logger.error "Bugsnag: error notifying bugsnag.com - #{error}" if error
          Configuration.onUncaughtException err if Configuration.onUncaughtException

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
    bugsnagError = new BugsnagError(error, options.errorName)

    delete options.errorName

    notification = new Notification(bugsnagError, options)
    notification.deliver cb

  # The error handler express/connect middleware. Performs a notify
  @errorHandler: (err, req, res, next) =>
    Configuration.logger.info "Handling express error: #{err.stack || err}"
    @notify err, req: req
    next err

  # The request middleware for express/connect. Ensures next(err) is called when there is an error, and
  # tracks the request for manual notifies.
  @requestHandler: (req, res, next) ->
    dom = domain.create()
    dom._bugsnagOptions = 
      req: req
    dom.on 'error', (err) ->
      dom.dispose()
      next err
    dom.run next

  # Intercepts the first argument from a callback and interprets it at as error.
  # if the error is not null it notifies bugsnag and doesn't call the callback 
  @intercept: (cb) =>
    cb = (->) unless cb
    if process.domain
      return process.domain.intercept cb
    else
      return (err, args...) =>
        return @notify(err) if err
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
    dom.on 'error', (err) =>
      dom.dispose()
      @notify err, options
    
    process.nextTick ->
      dom.run cb
    
    return dom

  shouldNotify = ->
    Configuration.notifyReleaseStages && Configuration.notifyReleaseStages.indexOf(Configuration.releaseStage) != -1 && Configuration.apiKey