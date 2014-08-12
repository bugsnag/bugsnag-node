path = require "path"

Logger = require "./logger"
Utils = require "./utils"

module.exports = class Configuration
  PAYLOAD_VERSION = "2"

  # Configuration
  @filters: ["password"]
  @notifyReleaseStages: null
  @projectRoot: path.dirname require?.main?.filename
  @autoNotifyUncaught: true
  @useSSL: true
  @proxy: null
  @notifyHost = "notify.bugsnag.com"
  @notifyPath = "/"
  @notifyPort = undefined
  @hostname = if process.env.DYNO then null else require("os").hostname()

  # Payload contents
  @apiKey: process.env.BUGSNAG_API_KEY
  @releaseStage: process.env.NODE_ENV || "production"
  @appVersion: null
  @metaData: {}

  @logger = new Logger()

  # The callback fired when we receive an uncaught exception. Defaults to printing the stack and exiting
  @onUncaughtError: (err) =>
    if (err instanceof Error) && err.domain
      # 0.8 doesn't support these attributes, so if they are undefined we have to exit anyway
      if err.domainThrown || err.domainEmitter || err.domainThrown == undefined
        @logger.error err.stack || err
        process.exit(1)
    else
      @logger.error err.stack || err
      process.exit(1)

  @configure: (options) =>
    # Do this before we do any logging
    @logger = options.logger if options.logger
    @logger.logLevel = options.logLevel if options.logLevel

    @payloadVersion = PAYLOAD_VERSION
    @releaseStage = options.releaseStage || @releaseStage
    @appVersion = options.appVersion || @appVersion
    @autoNotifyUncaught = if options.autoNotify? then options.autoNotify else @autoNotifyUncaught
    @useSSL = if options.useSSL? then options.useSSL else @useSSL
    @filters = options.filters || @filters
    @notifyReleaseStages = options.notifyReleaseStages || @notifyReleaseStages
    @notifyHost = options.notifyHost || @notifyHost
    @notifyPort = options.notifyPort || @notifyPort
    @notifyPath = options.notifyPath || @notifyPath
    @metaData = options.metaData || @metaData
    @onUncaughtError = options.onUncaughtError || @onUncaughtError
    @hostname = options.hostname || @hostname
    @proxy = options.proxy

    if options.projectRoot?
      @projectRoot = Utils.fullPath options.projectRoot

    if options.packageJSON? && !@appVersion
      @appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON))
