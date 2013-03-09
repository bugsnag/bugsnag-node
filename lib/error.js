var Bugsnag, Error, Utils, stacktrace;

stacktrace = require("stack-trace");

Utils = require("./utils");

Bugsnag = require("./bugsnag");

module.exports = Error = (function() {
  var processCallSites;

  function Error(error, errorClass) {
    var callSites;
    if (Utils.typeOf(error) === "string") {
      this.message = error;
      this.errorClass = errorClass || "Error";
    } else {
      this.message = error.message;
      this.errorClass = errorClass || error.constructor.name || error.name || "Error";
    }
    callSites = stacktrace.parse(error);
    if (callSites.length === 0) {
      callSites = stacktrace.get();
    }
    this.stacktrace = processCallSites(callSites);
  }

  processCallSites = function(callSites) {
    return callSites.map(function(callSite) {
      var frame, _ref;
      frame = {
        file: callSite.getFileName(),
        method: callSite.getMethodName() || callSite.getFunctionName(),
        lineNumber: callSite.getLineNumber(),
        columnNumber: callSite.getColumnNumber()
      };
      if ((Bugsnag.projectRoot != null) && ((_ref = callSite.getFileName()) != null ? _ref.indexOf(Bugsnag.projectRoot) : void 0) === 0) {
        frame.inProject = callSite.getFileName().indexOf("node_modules") === -1;
        frame.file = frame.file.substr(Bugsnag.projectRoot.length + 1);
      }
      return frame;
    });
  };

  return Error;

})();
