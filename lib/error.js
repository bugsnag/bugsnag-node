var Configuration, Error, Utils, stacktrace;

stacktrace = require("stack-trace");

Utils = require("./utils");

Configuration = require("./configuration");

module.exports = Error = (function() {
  var processCallSites;

  Error.buildErrors = function(error, errorClass) {
    var returnArray;
    returnArray = [new module.exports(error, errorClass)];
    if (error.oauthError) {
      returnArray.push(new module.exports(error.oauthError));
    }
    return returnArray;
  };

  function Error(error, errorClass) {
    var callSites;
    if (Utils.typeOf(error) === "string") {
      this.message = error;
      this.errorClass = errorClass || "Error";
    } else if (error) {
      this.message = error.message;
      this.errorClass = errorClass || error.constructor.name || error.name || "Error";
    } else {
      this.message = "[unknown]";
      this.errorClass = errorClass || "Error";
    }
    callSites = stacktrace.parse(error);
    if (callSites.length === 0) {
      callSites = stacktrace.get();
    }
    this.stacktrace = processCallSites(callSites, Configuration.projectRoot);
  }

  processCallSites = function(callSites) {
    return callSites.map(function(callSite) {
      var frame, _ref;
      frame = {
        file: callSite.getFileName(),
        method: callSite.getMethodName() || callSite.getFunctionName() || "none",
        lineNumber: callSite.getLineNumber(),
        columnNumber: callSite.getColumnNumber()
      };
      if ((Configuration.projectRoot != null) && ((_ref = callSite.getFileName()) != null ? _ref.indexOf(Configuration.projectRoot) : void 0) === 0) {
        frame.inProject = callSite.getFileName().indexOf("node_modules") === -1;
        if (!frame.inProject) {
          delete frame.inProject;
        }
        frame.file = frame.file.substr(Configuration.projectRoot.length + 1);
      }
      return frame;
    });
  };

  return Error;

})();
