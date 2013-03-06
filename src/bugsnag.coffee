path = require "path"

Utils = require "./utils"

Error.stackTraceLimit = Infinity

module.exports = class Bugsnag
	# Notifier Constants
	@NOTIFIER_NAME = "Bugsnag Node Notifier"
	@NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'))
	@NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node"
	@NOTIFICATION_HOST = "notify.bugsnag.com"
	@NOTIFICATION_PATH = '/'

	# Configuration
	@filters: ["password"]
	@notifyReleaseStages: ["production", "development"]
	@projectRoot: path.dirname require.main.filename
	@autoNotify: true
	@useSSL: true
	
	# Payload contents
	@apiKey: null
	@userId: null
	@context: null
	@releaseStage: process.env.NODE_ENV || "production"
	@appVersion: null
	@metaData: {}

	# The callback fired when we receive an uncaught exception. Defaults to printing the stack and exiting
	@onUncaughtException: (err) ->
		console.log err.stack || err
		process.exit(1)

	@register: (apiKey, options = {}) ->
		@apiKey = apiKey
		
		# Do this before we do any logging
		Logger.logLevel = options.logLevel if options.logLevel

		Logger.info "Registering with apiKey #{apiKey}"

		@releaseStage = options.releaseStage || @releaseStage
		@appVersion = options.appVersion || @appVersion
		@autoNotify = if options.autoNotify? then options.autoNotify else @autoNotify
		@autoNotify = if options.useSSL? then options.useSSL else @useSSL
		@notifyReleaseStages = options.notifyReleaseStages || @notifyReleaseStages
		
		if options.projectRoot?
			@projectRoot = fullPath options.projectRoot

		if options.packageJSON?
			@appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON))
		
		unless @appVersion
			@appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename),'package.json')) || Utils.getPackageVersion(path.join(projectRoot, 'package.json'))

		if @autoNotify
			Logger.info "Configuring uncaughtExceptionHandler"
			process.on "uncaughtException", (err) =>
				@notifyException err, (error, response) =>
					console.log "Bugsnag: error notifying bugsnag.com - #{error}" if error
					@onUncaughtException err

	@notifyException: (error, errorClass, options, cb) ->
		return unless @shouldNotify

		Logger.info "Notifying Bugsnag of exception...\n#{error?.stack || error}"

		# Convert arguments into an array
		args = Array.prototype.slice.call(arguments)

		args[1..].forEach (argument) ->
			switch Utils.typeOf argument
				when "string" then errorClass = argument
				when "object" then options = argument
				when "function" then cb = argument
		options ||= {}

		notifyBugsnagError new (require("./error"))(error, errorClass), options, cb

	@notify: (errorClass, errorMessage, options, cb) ->
		return unless @shouldNotify

		Logger.info "Notifying Bugsnag of exception...\n#{errorClass}: #{errorMessage}"
		
		# Convert arguments into an array
		args = Array.prototype.slice.call(arguments)
		
		args[2..].forEach (argument) ->
			switch Utils.typeOf argument
				when "object" then options = argument
				when "function" then cb = argument
		options ||= {}

		notifyBugsnagError new (require("./error"))(errorMessage, errorClass), cb
		
	notifyBugsnagError = (bugsnagError, options, cb) ->
		notification = new (require("./notification")) bugsnagError, options
		notification.deliver cb

	@shouldNotify: ->
		@notifyReleaseStages && @notifyReleaseStages.indexOf(@releaseStage) == -1

Logger = require("./logger")