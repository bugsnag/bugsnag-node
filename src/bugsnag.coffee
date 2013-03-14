domain = require "domain"
path = require "path"

Utils = require "./utils"

Logger = require "./logger"

# Make sure we get all stack frames from thrown errors
Error.stackTraceLimit = Infinity

module.exports = class Bugsnag
	# Configuration
  @filters: ["password"]
  @notifyReleaseStages: ["production", "development"]
  @projectRoot: path.dirname require.main.filename
  @autoNotifyUncaught: true
  @useSSL: true
  @notifyHost = "notify.bugsnag.com"
  @notifyPath = "/"
  @notifyPort = undefined
  
  # Payload contents
  @apiKey: null
  @releaseStage: process.env.NODE_ENV || "production"
  @appVersion: null
  @osVersion: null
  @metaData: {}

  @logger = new Logger()

  # The callback fired when we receive an uncaught exception. Defaults to printing the stack and exiting
  @onUncaughtException: (err) =>
    console.error err.stack || err
    process.exit(1)

  @register: (apiKey, options = {}) =>
    @apiKey = apiKey
    
    # Do this before we do any logging
    @logger.logLevel = options.logLevel if options.logLevel

    @logger.info "Registering with apiKey #{apiKey}"

    @releaseStage = options.releaseStage || @releaseStage
    @appVersion = options.appVersion || @appVersion
    @autoNotifyUncaught = if options.autoNotify? then options.autoNotify else @autoNotifyUncaught
    @useSSL = if options.useSSL? then options.useSSL else @useSSL
    @notifyReleaseStages = options.notifyReleaseStages || @notifyReleaseStages
    @notifyHost = options.notifyHost || @notifyHost
    @notifyPort = options.notifyPort || @notifyPort
    @notifyPath = options.notifyPath || @notifyPath
    @metaData = options.metaData || @metaData
    
    if options.projectRoot?
      @projectRoot = fullPath options.projectRoot

    if options.packageJSON? && !@appVersion
      @appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON))
    
    unless @appVersion
      @appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename),'package.json')) || Utils.getPackageVersion(path.join(@projectRoot, 'package.json'))

    if @autoNotifyUncaught
      @logger.info "Configuring uncaughtExceptionHandler"
      process.on "uncaughtException", (err) =>
        @notify err, (error, response) =>
          @logger.error "Bugsnag: error notifying bugsnag.com - #{error}" if error
          @onUncaughtException err if @onUncaughtException

  # Only error is required, and that can be a string or error object
  @notify: (error, options, cb) =>
    if Utils.typeOf(options) == "function"
      cb = options
      options = {}

    options ||= {}

    unless @shouldNotify()
      cb() if cb
      return

    @logger.info "Notifying Bugsnag of exception...\n#{error?.stack || error}"
    bugsnagError = new (require("./error"))(error, options.errorName)

    delete options.errorName

    notification = new (require("./notification"))(bugsnagError, options)
    notification.deliver cb

  @shouldNotify: =>
    @notifyReleaseStages && @notifyReleaseStages.indexOf(@releaseStage) != -1 && @apiKey

  @errorHandler: (err, req, res, next) =>
    @logger.info "Handling express error: #{err.stack}"
    @notify err, req: req
    next err

  @requestHandler: (req, res, next) ->
    dom = domain.create()
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
    dom.on 'error', (err) =>
      dom.dispose()
      @notify err, options
    
    process.nextTick ->
      dom.run cb
    
    return dom