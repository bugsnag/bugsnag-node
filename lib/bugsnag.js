trace = require('tracejs').trace;
http = require('http');
https = require('https')
fs = require('fs');
path = require('path');

getPackageVersion = function(packageJSON) {
  try {
    contents = fs.readFileSync(packageJSON, 'UTF-8');
  } catch(e) {
    return "unknown";
  }
  packageInfo = JSON.parse(contents);
  return packageInfo.version;
}

var defaultErrorHash = {
  apiKey : "",
  notifier : {
    name : "Bugsnag Node Notifier",
    version : getPackageVersion(path.join(__dirname,'..' + path.sep +'package.json')),
    url : "www.bugsnag.com"
  }
}
var releaseStage;
var projectRoot;
var appVersion;
var notifyReleaseStages;
var autoNotify;
var useSSL;
var userId;
var context;
var extraData;
var filters = ["password"];

var onUncaughtException = function(err) {
  if(err.stack) {
    console.log(err.stack);
  } else {
    console.log(err);
  }
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

exports.setFilters = function(passedFilters) {
  filters = passedFilters;
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
  releaseStage = (options.releaseStage === undefined ? (process.env.NODE_ENV === undefined ? "production" : process.env.NODE_ENV) : options.releaseStage);
  appVersion = (options.appVersion === undefined ? undefined : options.appVersion);
  autoNotify = (options.autoNotify === undefined ? true : options.autoNotify);
  notifyReleaseStages = (options.notifyReleaseStages === undefined ? ["production", "development"] : options.notifyReleaseStages);
  useSSL = (options.useSSL === undefined ? true : options.useSSL);
  
  if(options.projectRoot === undefined) {
    projectRoot = path.dirname(require.main.filename);
  } else {
    projectRoot = options.projectRoot.indexOf(path.sep) == 0 ? options.projectRoot : path.join(__dirname, options.projectRoot);
  }
  
  if ( options.packageJSON !== undefined ) {
    appVersion = options.packageJSON.indexOf(path.sep) == 0 ? getPackageVersion(options.packageJSON) : getPackageVersion(path.join(__dirname,options.packageJSON));
  }
  if( appVersion === undefined || appVersion == "unknown" ) {
    appVersion = getPackageVersion(path.join(path.dirname(require.main.filename),'package.json'));
    if(appVersion === undefined || appVersion == "unknown") {
      appVersion = getPackageVersion(path.join(projectRoot,'package.json'));
    }
  }
  
  if(autoNotify) {
    process.on('uncaughtException', function(err) {
      exports.notify(err, {userId: userId, context: context}, function(error){
        if(error) {
          console.log("Bugsnag: error notifying bugsnag.com - " + error);
        }
        onUncaughtException(err);
      });
    });
  }
  
  return exports.handle
}

getUserIdFromOptions = function(options) {
  var localUserId = null;
  if(options.userId !== undefined && options.userId != null) {
    localUserId = options.userId
  } else if(userId !== undefined && userId != null) {
    localUserId = userId;
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
  return localUserId;
}

getContextFromOptions = function(options) {
  var localContext = null;
  if(options.context !== undefined && options.context != null) {
    localContext = options.context;
  } else if(context !== undefined && context != null) {
    localContext = context;
  } else if(options.req !== undefined && options.req != null) {
    localContext = options.req.url;
  }
  return localContext;
}

getMetaDataFromOptions = function(options) {
  var localMetaData = {};
  if(options.extraData !== undefined && options.extraData != null) {
    localMetaData["customData"] = options.extraData;
  } else if(extraData !== undefined && extraData != null) {
    localMetaData["customData"] = extraData;
  }
  
  if(localMetaData["customData"] !== undefined && localMetaData["customData"] != null) {
    var metaDataKeys = Object.keys(localMetaData["customData"]);
    for(var key in metaDataKeys) {
      if(filters.indexOf(key) != -1) {
        localMetaData[key] = undefined;
      }
    }
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
    localMetaData["request"] = requestHash;
  }

  return localMetaData;
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
exports.notifyWithClass = function(errorClass, error, options, cb) {
  if(options instanceof Function){
    cb = options;
    options = undefined;
  }
  //let the default action happen
  options = (options === undefined ? {} : options)
  
  if(!shouldNotify(cb)) return;

  var errorMessage;
  var stacktrace;
  if(typeof error == 'string') {
    errorMessage = error;
    var stack = {}
    Error.captureStackTrace(stack,arguments.callee);
    stacktrace = trace(stack);
  } else {
    stacktrace = trace(error);
    errorMessage = stacktrace.first_line.split(": ")[1]
  }
  
  notifyError(errorClass, errorMessage, stacktrace, getUserIdFromOptions(options), getContextFromOptions(options), getMetaDataFromOptions(options), cb);
}

// Notify about a caught error
exports.notify = function(error, options, cb) {
  if(options instanceof Function){
    cb = options;
    options = undefined;
  }
  //let the default action happen
  options = (options === undefined ? {} : options)
  
  if(!shouldNotify(cb)) return;
  
  var errorClass;
  var errorMessage;
  var stacktrace;
  
  if(typeof error == 'string') {
    errorClass = "Error";
    errorMessage = error;
    var stack = {}
    Error.captureStackTrace(stack,arguments.callee);
    stacktrace = trace(stack);
  } else {
    stacktrace = trace(error);
    errorClass = stacktrace.first_line.split(": ")[0];
    errorMessage = stacktrace.first_line.split(": ")[1]
  }
  
  notifyError(errorClass, errorMessage, stacktrace, getUserIdFromOptions(options), getContextFromOptions(options), getMetaDataFromOptions(options), cb);
}

shouldNotify = function(callback) {
  if(typeof defaultErrorHash.apiKey === "undefined" || defaultErrorHash.apiKey === null || defaultErrorHash.apiKey == "") {
    var message = "Bugsnag: No apiKey set - not notifying.";
    console.log(message);
    if(callback instanceof Function) {
      process.nextTick(function() { 
        callback(new Error(message))
      });
    }
    return false;
  }
  
  if(typeof notifyReleaseStages !== "undefined" && notifyReleaseStages !== null && notifyReleaseStages.indexOf(releaseStage) == -1) {
    if(callback instanceof Function) {
      process.nextTick(callback);
    }
    return false;
  }
  return true;
}

notifyError = function(errorClass, errorMessage, stacktrace, passedUserId, passedContext, metaData, cb) {
  metaData = (metaData === undefined ? {} : metaData)
  var errorList = [{
    appVersion: appVersion,
    releaseStage: releaseStage,
    metaData: metaData,
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
  errorList[0].metaData.environment = errorList[0].metaData.environment || {};
  errorList[0].metaData.environment.memoryUsage = { total: memUsage.heapTotal, used: memUsage.heapUsed };
  
  for(var i = 0, len = stacktrace.frames.length; i < len; ++i) {
    var stackFrame = stacktrace.frames[i];
    if(stackFrame !== undefined) {
      var bugsnagFrame = {
        file: stackFrame.filename,
        lineNumber: stackFrame.line,
        method: stackFrame.named_location
      }
      if( projectRoot != "" && 
          stackFrame.filename.indexOf(projectRoot) == 0) {
        if ( stackFrame.filename.indexOf("node_modules") == -1 ) {
          bugsnagFrame.inProject = true;
        }
        bugsnagFrame.file = stackFrame.filename.substr(projectRoot.length + 1);
      }
      errorList[0].exceptions[0].stacktrace.push(bugsnagFrame);
    }
  }

  defaultErrorHash.errors = errorList;
  var payload = JSON.stringify(defaultErrorHash);
  
  var port = useSSL ? 443 : 80;
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
  
  var callback = function(res){
    if(cb instanceof Function){
      res.setEncoding('utf8');
      var bodyRes = '';
      res.on('data', function (chunk) {
        if(chunk){
          bodyRes += chunk;
        }
      }).on('end', function(){
        if(res.statusCode == 200){
          return cb(null, bodyRes);
        }else{
          return cb(new Error(bodyRes));
        }
      })
    }
  }

  var req;
  if(useSSL) {
    req = https.request(options, callback);
  } else {
    req = http.request(options, callback);
  }
  req.on('error', function(e) {
    if(cb instanceof Function){
      cb(e);
    }
  });
  req.write(payload, 'utf8');
  req.end();
}