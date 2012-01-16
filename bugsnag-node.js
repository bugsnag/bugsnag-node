trace = require('tracejs').trace;
http = require('http');
fs = require('fs');

var defaultErrorHash = {
  apiKey : "",
  notifier : {
    name : "Bugsnag Node Notifier",
    version : "1.0.0",
    url : "www.bugsnag.com"
  }
}
var releaseStage;
var userIdLambda;
var contextLambda;
var projectDirectory;
var applicationVersion = "unknown";
var onUncaughtException = function(err) {
  exit();
}

process.on('uncaughtException', function(err) {
  exports.notify(err);
  onUncaughtException();
});

exports.testNotification = function() {
  exports.notify(new Error("Test error "));
}

exports.notify = function(error) {
  var stacktrace = trace(error);
  var errorList = [{
    userId: userIdLambda(),
    appVersion: applicationVersion,
    releaseStage: releaseStage,
    metaData: {
      environment: {
        memoryUsage: process.memoryUsage()
      }
    },
    exceptions: [{
      errorClass: "Error",
      message: stacktrace.first_line,
      stacktrace: []
    }]
  }];
  
  for(var i = 0, len = stacktrace.frames.length; i < len; ++i) {
    errorList[0].exceptions[0].stacktrace[i] = {
      file: stacktrace.frames[i].filename,
      lineNumber: stacktrace.frames[i].line,
      method: stacktrace.frames[i].named_location
    }
    if( projectDirectory != "" && 
        stacktrace.frames[i].filename.indexOf(projectDirectory) == 0 && 
        stacktrace.frames[i].filename.indexOf("node_modules") == -1) {
      errorList[0].exceptions[0].stacktrace[i].inProject = true;
      errorList[0].exceptions[0].stacktrace[i].file = stacktrace.frames[i].filename.substr(projectDirectory.length + 1);
    }
  }
  
  defaultErrorHash.errors = errorList;
  
  var payload = JSON.stringify(defaultErrorHash);
  var options = {
    host: 'api.bugsnag.com',
    port: 8000,
    path: '/notify',
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
      "Content-Length": payload.length
    }
  };

  var req = http.request(options, function(response) {});
  req.write(payload, 'utf8');
  req.end();
}

exports.register = function(apiKey, options) {
  Error.stackTraceLimit = Infinity;
  defaultErrorHash.apiKey = apiKey;
  releaseStage = (options.releaseStage === undefined ? "release" : options.releaseStage);
  contextLambda = (options.context === undefined ? undefined : options.context);
  userIdLambda = (options.userId === undefined ? function() {return "unknown";} : options.userId);
  applicationVersion = (options.applicationVersion === undefined ? undefined : options.applicationVersion);
  if ( options.packageJSON !== undefined ) {
    populateApplicationVersion(options.packageJSON);
  }
  if( applicationVersion === undefined || applicationVersion == "unknown" ) {
    populateApplicationVersion(__dirname + '/../package.json');
  }
  
  projectDirectory = (options.projectDirectory === undefined ? "" : options.projectDirectory);
}

exports.setContext = function(lambda) {
  contextLambda = lambda
}

exports.setUserId = function(lambda) {
  userIdLambda = lambda;
}

exports.setUncaughtExceptionHandler = function(lambda) {
  onUncaughtException = lambda;
}

exports.setApplicationVersion = function(version) {
  applicationVersion = version;
}

populateApplicationVersion = function(packageJSON) {
  try {
    contents = fs.readFileSync(packageJSON, 'UTF-8');
  } catch(e) {
    applicationVersion = "unknown";
    return;
  }
  packageInfo = JSON.parse(contents);
  applicationVersion = packageInfo.version;
}