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
var userId;
var context;
var extraData;

var onUncaughtException = function(err) {
  console.log(err);
  process.exit(1);
}

exports.setUserId = function(passedUserId) {
  userId = passedUserId;
}

exports.setContext = function(passedContext) {
  context = passedContext;
}

exports.setExtraData = function(passedExtraData) {
  extraData = passedExtraData;
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
      exports.notify(err, {userId: userId, context: context});
      onUncaughtException(err);
    });
  }
  
  return exports.handle
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

getUserIdFromOptions = function(options) {
  var localUserId = null;
  if(options.userId !== undefined && options.userId != null) {
    localUserId = options.userId
  } else if(options.req !== undefined && options.req != null){
    localUserId = options.req.connection.remoteAddress;
    if(localUserId === undefined || localUserId == null || localUserId == "127.0.0.1") {
      try {
        var temp = options.req.headers['x-forwarded-for'];
        if(temp !== undefined && temp != null) {
          localUserId = temp;
        }
      }catch(e){}
    }
  }
  if(localUserId === undefined || localUserId == null) {
    localUserId = userId;
  }
  return localUserId;
}

getContextFromOptions = function(options) {
  var localContext = null;
  if(options.context !== undefined && options.context != null) {
    localContext = options.context;
  } else if(options.req !== undefined && options.req != null) {
    localContext = options.req.url;
  } else {
    localContext = context;
  }
  return localContext;
}

getExtraDataFromOptions = function(options) {
  var localExtraData = null;
  if(options.extraData !== undefined && options.extraData != null) {
    localExtraData = options.extraData;
  } else if(extraData !== undefined && extraData != null) {
    localExtraData = extraData;
  } else {
    localExtraData = {};
  }
  
  if(options.req !== undefined && options.req != null) {
    var requestHash = {};
    requestHash["url"] = options.req.url;
    requestHash["method"] = options.req.method;
    requestHash["headers"] = options.req.headers;
    requestHash["httpVersion"] = options.req.httpVersion;
    
    var connectionHash = {}
    connectionHash["remoteAddress"] = options.req.connection.remoteAddress;
    connectionHash["remotePort"] = options.req.connection.remotePort;
    connectionHash["bytesRead"] = options.req.connection.bytesRead;
    connectionHash["bytesWritten"] = options.req.connection.bytesWritten;
    connectionHash["localPort"] = options.req.connection.address()["port"];
    connectionHash["localAddress"] = options.req.connection.address()["address"];
    connectionHash["IPVersion"] = options.req.connection.address()["family"];
    
    requestHash["connection"] = connectionHash;
    extraData["request"] = requestHash;
  }
  return extraData;
}

// Send a test error
exports.testNotification = function() {
  exports.notify(new Error("Test error"));
}

// Handle connect errors (also express)
exports.handle = function(err, req, res, next) {
  exports.notify(err, {req:req});
  next(err);
}

// Notify with a specified error class
exports.notifyWithClass = function(errorClass, error, options) {
  options = (options === undefined ? {} : options)

  var errorMessage;
  if(typeof error == 'string') {
    errorMessage = error;
    error = new Error(error);
  } else {
    errorMessage = stacktrace.first_line.split(": ")[1]
  }
  
  var stacktrace = trace(error);
  notifyError(errorClass, errorMessage, stacktrace, getUserIdFromOptions(options), getContextFromOptions(options), getExtraDataFromOptions(options));
}

// Notify about a caught error
exports.notify = function(error, options) {
  options = (options === undefined ? {} : options)
  
  if(typeof error == 'string') {
    error = new Error(error);
  }

  var stacktrace = trace(error);
  errorClass = stacktrace.first_line.split(": ")[0];
  errorMessage = stacktrace.first_line.split(": ")[1];
  
  notifyError(errorClass, errorMessage, stacktrace, getUserIdFromOptions(options), getContextFromOptions(options), getExtraDataFromOptions(options));
}

notifyError = function(errorClass, errorMessage, stacktrace, passedUserId, passedContext, extraData) {
  if(defaultErrorHash.apiKey == "") {
    console.log("Bugsnag: No apiKey set - not notifying.");
    return;
  }
  
  extraData = (extraData === undefined ? {} : extraData)
  var errorList = [{
    appVersion: appVersion,
    releaseStage: releaseStage,
    metaData: extraData,
    exceptions: [{
      errorClass: errorClass,
      message: errorMessage,
      stacktrace: []
    }]
  }];

  if(passedUserId !== undefined && passedUserId != null ) {
    errorList[0].userId = passedUserId;
  }
  if(passedContext !== undefined && passedContext != null ) {
    errorList[0].context = passedContext;
  }

  var memUsage = process.memoryUsage();
  errorList[0].metaData.environment = {};
  errorList[0].metaData.environment.memoryUsage = { total: memUsage.heapTotal, used: memUsage.heapUsed };
  
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