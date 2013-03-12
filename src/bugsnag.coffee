path = require "path"

Utils = require "./utils"

Error.stackTraceLimit = Infinity

module.exports = class Bugsnag
	# Notifier Constants
	@NOTIFIER_NAME = "Bugsnag Node Notifier"
	@NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'))
	@NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node"

	# Configuration
	@filters: ["password"]
	@notifyReleaseStages: ["production", "development"]
	@projectRoot: path.dirname require.main.filename
	@autoNotify: true
	@useSSL: true
	@notifyHost = "notify.bugsnag.com"
	@notifyPath = "/"
	@notifyPort = undefined
	
	# Payload contents
	@apiKey: null
	@userId: null
	@context: null
	@releaseStage: process.env.NODE_ENV || "production"
	@appVersion: null
	@osVersion: null
	@metaData: {}

	# The callback fired when we receive an uncaught exception. Defaults to printing the stack and exiting
	@onUncaughtException: (err) =>
		console.log err.stack || err
		process.exit(1)

	@register: (apiKey, options = {}) =>
		@apiKey = apiKey
		
		# Do this before we do any logging
		Logger.logLevel = options.logLevel if options.logLevel

		Logger.info "Registering with apiKey #{apiKey}"

		@releaseStage = options.releaseStage || @releaseStage
		@appVersion = options.appVersion || @appVersion
		@autoNotify = if options.autoNotify? then options.autoNotify else @autoNotify
		@useSSL = if options.useSSL? then options.useSSL else @useSSL
		@notifyReleaseStages = options.notifyReleaseStages || @notifyReleaseStages
		@notifyHost = options.notifyHost || @notifyHost
		@notifyPort = options.notifyPort || @notifyPort
		@notifyPath = options.notifyPath || @notifyPath
		
		if options.projectRoot?
			@projectRoot = fullPath options.projectRoot

		if options.packageJSON?
			@appVersion = Utils.getPackageVersion(Utils.fullPath(options.packageJSON))
		
		unless @appVersion
			@appVersion = Utils.getPackageVersion(path.join(path.dirname(require.main.filename),'package.json')) || Utils.getPackageVersion(path.join(@projectRoot, 'package.json'))

		if @autoNotify
			Logger.info "Configuring uncaughtExceptionHandler"
			process.on "uncaughtException", (err) =>
				@notify err, (error, response) =>
					console.log "Bugsnag: error notifying bugsnag.com - #{error}" if error
					@onUncaughtException err if @onUncaughtException

	# Only error is required, and that can be a string or error object
	# The other three arguments are string, object and function and can be passed in
	# an order, or omitted
	# string errorClass = The class of error to be created
	# object options = The options for the notification
	# function cb = The callback function
	@notify: (error) =>
		return unless @shouldNotify()

		# reset the arguments, we want errorClass to be there, but also optional
		errorClass = undefined
		options = {}
		cb = undefined

		# Convert arguments into an array
		args = Array.prototype.slice.call(arguments)

		args[1..].forEach (argument) ->
			switch Utils.typeOf argument
				when "string" then errorClass = argument
				when "object" then options = argument
				when "function" then cb = argument

		Logger.info "Notifying Bugsnag of exception...\n#{error?.stack || error}"
		bugsnagError = new (require("./error"))(error, errorClass)
		notification = new (require("./notification"))(bugsnagError, options)
		notification.deliver cb

	@shouldNotify: =>
		@notifyReleaseStages && @notifyReleaseStages.indexOf(@releaseStage) != -1

	@handle: (err, req, res, next) =>
		Logger.info "Handling express error: #{require("util").inspect err, true, null, true}"
		@notify err, req: req
		next err if next

Logger = require("./logger")