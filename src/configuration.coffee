path = require "path"

Logger = require "./logger"
Utils = require "./utils"

module.exports = class Configuration
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
  @metaData: {}

  @exitOnUncaught = true

  @logger = new Logger()

  # The callback fired when we receive an uncaught exception. Defaults to printing the stack and exiting
  @onUncaughtException: (err) =>
    console.error err.stack || err
    process.exit(1) if @exitOnUncaught

  @configure: (options) =>
    # Do this before we do any logging
    @logger.logLevel = options.logLevel if options.logLevel
    @logger = options.logger if options.logger

    @releaseStage = options.releaseStage || @releaseStage
    @appVersion = options.appVersion || @appVersion
    @autoNotifyUncaught = if options.autoNotify? then options.autoNotify else @autoNotifyUncaught
    @useSSL = if options.useSSL? then options.useSSL else @useSSL
    @notifyReleaseStages = options.notifyReleaseStages || @notifyReleaseStages
    @notifyHost = options.notifyHost || @notifyHost
    @notifyPort = options.notifyPort || @notifyPort
    @notifyPath = options.notifyPath || @notifyPath
    @metaData = options.metaData || @metaData
    @exitOnUncaught = if options.exitOnUncaught == undefined then @exitOnUncaught else options.exitOnUncaught
    
    if options.projectRoot?
      @projectRoot = Utils.fullPath options.projectRoot

    if options.packageJSON? && !@appVersion
      @appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON))
    
    unless @appVersion
      @appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename),'package.json')) || Utils.getPackageVersion(path.join(@projectRoot, 'package.json'))