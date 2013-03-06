Bugsnag = require "./bugsnag"
Utils = require "./utils"
Logger = require("./logger")

module.exports = class Notification
	constructor: (bugsnagError, options = {}) ->
		@events = [
			userId: options.userId || Bugsnag.userId
			appVersion: Bugsnag.appVersion
			osVersion: Bugsnag.osVersion
			releaseStage: Bugsnag.releaseStage
			context: options.context || Bugsnag.context
			exceptions: [bugsnagError]
		]

		delete options.userId
		delete options.context
		@events[0].metaData = Utils.cloneObject Bugsnag.metaData

		if options.req
			@processRequest options.req
			delete options.req

		Utils.mergeObjects @events[0].metaData, options

		@apiKey = Bugsnag.apiKey
		@notifier = 
			name: Bugsnag.NOTIFIER_NAME
			version: Bugsnag.NOTIFIER_VERSION
			url: Bugsnag.NOTIFIER_URL

	processRequest: (req) ->
		@events[0].metaData.request =
    	url: req.url
    	method: req.method
    	headers: req.headers
    	httpVersion: req.httpVersion
    	connection:
	    	remoteAddress: req.connection?.remoteAddress
	    	remotePort: req.connection?.remotePort
	    	bytesRead: req.connection?.bytesRead
	    	bytesWritten: req.connection?.bytesWritten
	    	localPort: req.connection?.address()?.port
	    	localAddress: req.connection?.address()?.address
	    	IPVersion: req.connection?.address()?.family

	   @events[0].context ||= req.url
	   @events[0].userId ||= req.headers["x-forwarded-for"] || req.connection?.remoteAddress

	deliver: (cb) ->
		cb = null unless Utils.typeOf(cb) == "function"
		
		# Filter before sending
		Utils.filterObject(@events[0].metaData, Bugsnag.filters)

		Logger.info "Delivering exception..."

		payload = JSON.stringify @
		options =
    	host: Bugsnag.NOTIFICATION_HOST
    	port: if Bugsnag.useSSL then 443 else 80
    	path: Bugsnag.NOTIFICATION_PATH
    	method: 'POST'
    	headers:
      	"Content-Type": 'application/json'
      	"Content-Length": payload.length

    Logger.info payload

	  if Bugsnag.useSSL
	  	req = require("https").request(options, responseCallback(cb))
	  else
	  	req = require("http").request(options, responseCallback(cb))

	  req.on "error", (err) -> cb e if cb
	  req.write payload, "utf-8"
	  req.end()

	responseCallback = (cb) ->
		cb = null unless Utils.typeOf(cb) == "function"

		return (res) ->
			if cb
     		bodyRes = ""

     		res.setEncoding 'utf8'
      	res
      	.on('data', (chunk) -> bodyRes += chunk if chunk)
      	.on 'end', () ->
	        if res.statusCode == 200
	          return cb null, bodyRes
	        else
	        	return cb new Error(bodyRes)