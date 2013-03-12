stacktrace = require "stack-trace"
Utils = require "./utils"
Bugsnag = require "./bugsnag"

module.exports = class Error
	constructor: (error, errorClass) ->
		if Utils.typeOf(error) == "string"
			@message = error
			@errorClass = errorClass || "Error"
		else
			@message = error.message
			@errorClass = errorClass || error.constructor.name || error.name || "Error"

		callSites = stacktrace.parse error
		callSites = stacktrace.get() if callSites.length == 0

		@stacktrace = processCallSites(callSites)

	processCallSites = (callSites) ->
		return callSites.map (callSite) ->
			frame = 
				file: callSite.getFileName()
				method: callSite.getMethodName() || callSite.getFunctionName() || "none"
				lineNumber: callSite.getLineNumber()
				columnNumber: callSite.getColumnNumber()

			if Bugsnag.projectRoot? && callSite.getFileName()?.indexOf(Bugsnag.projectRoot) == 0
				frame.inProject = callSite.getFileName().indexOf("node_modules") == -1
				delete frame.inProject unless frame.inProject
				frame.file = frame.file.substr(Bugsnag.projectRoot.length + 1)

			return frame