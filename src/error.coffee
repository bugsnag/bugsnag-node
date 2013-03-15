stacktrace = require "stack-trace"
Utils = require "./utils"
Configuration = require "./configuration"

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

    @stacktrace = processCallSites(callSites, Configuration.projectRoot)

  processCallSites = (callSites) ->
    return callSites.map (callSite) ->
      frame = 
        file: callSite.getFileName()
        method: callSite.getMethodName() || callSite.getFunctionName() || "none"
        lineNumber: callSite.getLineNumber()
        columnNumber: callSite.getColumnNumber()

      if Configuration.projectRoot? && callSite.getFileName()?.indexOf(Configuration.projectRoot) == 0
        frame.inProject = callSite.getFileName().indexOf("node_modules") == -1
        delete frame.inProject unless frame.inProject
        frame.file = frame.file.substr(Configuration.projectRoot.length + 1)

      return frame