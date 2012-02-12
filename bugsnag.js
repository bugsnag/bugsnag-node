//TODO: The set user id and set context functions wont be scoped to each request in express.js for example.

trace = require('tracejs').trace;
http = require('http');
fs = require('fs');
path = require('path');

var defaultErrorHash = {
  apiKey : "",
  notifier : {
    name : "Bugsnag Node Notifier",
    version : "",
    url : "www.bugsnag.com"
  }
}
var releaseStage;
var userIdLambda;
var contextLambda;
var projectDirectory;
var applicationVersion = "unknown";
var onUncaughtException = function(err) {
  console.log(err);
  process.exit(1);
}

getPackageVersion = function(packageJSON) {
  try {
    contents = fs.readFileSync(packageJSON, 'UTF-8');
  } catch(e) {
    return "unknown";
  }
  packageInfo = JSON.parse(contents);
  return packageInfo.version;
}

exports.handleExceptions = function() {
  process.on('uncaughtException', function(err) {
    exports.notify(err);
    onUncaughtException(err);
  });
}

// Send a test notification
exports.testNotification = function() {
  exports.notify(new Error("Test error "));
}

// Notify about a caught error
exports.notify = function(error) {
  if(defaultErrorHash.apiKey == "") {
    console.log("Bugsnag: No apiKey set - not notifying.");
    return;
  } else {
    console.log("Bugnsag: Notifying bugsnag of error");
  }
  var stacktrace = trace(error);
  var errorList = [{
    userId: userIdLambda(),
    appVersion: applicationVersion,
    releaseStage: releaseStage,
    metaData: {
      environment: process.env
    },
    exceptions: [{
      errorClass: "Error",
      message: stacktrace.first_line,
      stacktrace: []
    }]
  }];
  errorList[0].metadata.environment.memoryUsage = process.memoryUsage();
  
  for(var i = 0, len = stacktrace.frames.length; i < len; ++i) {
    errorList[0].exceptions[0].stacktrace[i] = {
      file: stacktrace.frames[i].filename,
      lineNumber: stacktrace.frames[i].line,
      method: stacktrace.frames[i].named_location
    }
    if( projectDirectory != "" && 
        stacktrace.frames[i].filename.indexOf(projectDirectory) == 0) {
      if ( stacktrace.frames[i].filename.indexOf("node_modules") == -1 ) {
        errorList[0].exceptions[0].stacktrace[i].inProject = true;
      }
      errorList[0].exceptions[0].stacktrace[i].file = stacktrace.frames[i].filename.substr(projectDirectory.length + 1);
    }
  }
  
  if ( contextLambda !== undefined ) {
    errorList[0].context = contextLambda();
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

// Register to process uncaught exceptions properly
exports.register = function(apiKey, options) {
  options = (options === undefined ? {} : options)
  
  Error.stackTraceLimit = Infinity;
  defaultErrorHash.apiKey = apiKey;
  releaseStage = (options.releaseStage === undefined ? "release" : options.releaseStage);
  contextLambda = (options.context === undefined ? undefined : options.context);
  userIdLambda = (options.userId === undefined ? function() {return "unknown";} : options.userId);
  applicationVersion = (options.applicationVersion === undefined ? undefined : options.applicationVersion);
  if ( options.packageJSON !== undefined ) {
    applicationVersion = getPackageVersion(options.packageJSON);
  }
  if( applicationVersion === undefined || applicationVersion == "unknown" ) {
    applicationVersion = getPackageVersion(path.join(__dirname, '../../package.json'));
  }
  
  projectDirectory = (options.projectDirectory === undefined ? path.join(__dirname, "../..") : options.projectDirectory);
  defaultErrorHash.notifier.version = getPackageVersion(path.join(__dirname,'package.json'))
}

// Set a lambda function to detail the context of the call
exports.setContext = function(lambda) {
  contextLambda = lambda
}

// Set a lambda function to detail the user affected
exports.setUserId = function(lambda) {
  userIdLambda = lambda;
}

// Set a lambda function to detail what happens once an uncaught exception is processed. Defaults to exit(1)
exports.setUncaughtExceptionHandler = function(lambda) {
  onUncaughtException = lambda;
}

// Set the application version
exports.setApplicationVersion = function(version) {
  applicationVersion = version;
}