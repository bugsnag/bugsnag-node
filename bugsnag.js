trace = require('tracejs').trace;
http = require('http');
https = require('https')
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
var projectDirectory;
var appVersion;
var notifyReleaseStages;
var autoNotify;
var enableSSL;

var onUncaughtException = function(err) {
  console.log(err);
  process.exit(1);
}

// Set a lambda function to detail what happens once an uncaught exception is processed. Defaults to exit(1)
exports.setUncaughtExceptionHandler = function(lambda) {
  onUncaughtException = lambda;
}

// Register to process uncaught exceptions properly
exports.register = function(apiKey, options) {
  options = (options === undefined ? {} : options)
  
  Error.stackTraceLimit = Infinity;
  defaultErrorHash.apiKey = apiKey;
  releaseStage = (options.releaseStage === undefined ? "production" : options.releaseStage);
  appVersion = (options.appVersion === undefined ? undefined : options.appVersion);
  autoNotify = (options.autoNotify === undefined ? true : options.autoNotify);
  notifyReleaseStages = (options.notifyReleaseStages === undefined ? ["production"] : options.notifyReleaseStages);
  enableSSL = (options.enableSSL === undefined ? undefined : options.enableSSL);
  
  if ( options.packageJSON !== undefined ) {
    appVersion = getPackageVersion(options.packageJSON);
  }
  if( appVersion === undefined || appVersion == "unknown" ) {
    appVersion = getPackageVersion(path.join(__dirname, '../../package.json'));
  }
  
  projectDirectory = (options.projectDirectory === undefined ? path.join(__dirname, "../..") : options.projectDirectory);
  defaultErrorHash.notifier.version = getPackageVersion(path.join(__dirname,'package.json'));
  
  if(autoNotify) {
    process.on('uncaughtException', function(err) {
      exports.notify(err);
      onUncaughtException(err);
    });
  }
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

// Send a test notification
exports.testNotification = function() {
  exports.notify(new Error("Test error"));
}

exports.notifyWithClass = function(errorClass, error) {
  var errorMessage;
  if(typeof error == 'string') {
    errorMessage = error;
    error = new Error(error);
  } else {
    errorMessage = stacktrace.first_line.split(": ")[1]
  }
  
  var stacktrace = trace(error);
  notifyError(errorClass, errorMessage, stacktrace);
}

// Notify about a caught error
exports.notify = function(error) {
  if(defaultErrorHash.apiKey == "") {
    console.log("Bugsnag: No apiKey set - not notifying.");
    return;
  }
  if(typeof error == 'string') {
    error = new Error(error);
  }
  
  var stacktrace = trace(error);
  errorClass = stacktrace.first_line.split(": ")[0];
  errorMessage = stacktrace.first_line.split(": ")[1];
  
  notifyError(errorClass, errorMessage, stacktrace);
}

notifyError = function(errorClass, errorMessage, stacktrace) {
  var errorList = [{
    appVersion: appVersion,
    releaseStage: releaseStage,
    metaData: {
      environment: process.env
    },
    exceptions: [{
      errorClass: errorClass,
      message: errorMessage,
      stacktrace: []
    }]
  }];
  errorList[0].metaData.environment.memoryUsage = JSON.stringify(process.memoryUsage());
  
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

  defaultErrorHash.errors = errorList;
  
  var payload = JSON.stringify(defaultErrorHash);
  var port = enableSSL ? 443 : 80;
  var options = {
    host: 'notify.bugsnag.com',
    port: port,
    path: '/',
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
      "Content-Length": payload.length
    }
  };
  
  var req;
  if(enableSSL) {
    req = https.request(options, function(response) {});
  } else {
    req = http.request(options, function(response) {});
  }
  req.write(payload, 'utf8');
  req.end();
}