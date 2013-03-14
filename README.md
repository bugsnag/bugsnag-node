Bugsnag Notifier for Node.js
============================

The Bugsnag Notifier for Node.js gives you instant notification of exceptions from your Node.js applications. By default, the notifier hooks into `uncaughtException` event, which means any uncaught exceptions will trigger a notification to be sent to your Bugsnag project.

[Bugsnag](http://bugsnag.com) captures errors in real-time from your web, mobile and desktop applications, helping you to understand and resolve them as fast as possible. [Create a free account](http://bugsnag.com) to start capturing exceptions from your applications.


Installation & Setup
--------------------

Run npm install to install the latest bugsnag notifier version.

```bash
npm install bugsnag --save
```

Require bugsnag in your node.js script.

```javascript
bugsnag = require("bugsnag");
```

Register the bugsnag notifier.

```javascript
bugsnag.register("your-api-key-goes-here");
```

See the full documentation for the [register](#register) function for more details.


Using Express or Connect Middleware
-----------------------------------

In order for bugsnag to be able to know which request was affected by an error, you need to add a request middleware. This middleware performs the same function as [connect-domain](https://github.com/baryshev/connect-domain) and uses [domains](http://nodejs.org/api/domain.html) to perform more in depth error handling.

```javascript
app.use(bugsnag.requestHandler);
```

In order to have bugsnag report on any errors in your express or connect app, you need to add the bugsnag middleware to your express or connect app. In order to do that, simply pass `bugsnag.errorHandler` into app.use().

```javascript
app.use(bugsnag.errorHandler);
```

Using Coffeescript
------------------

When running coffeecript code using the `coffee` executable, Bugsnag cannot notify about uncaught exceptions that are at the top level of your app. It will only be able to notify about those uncaught exceptions in callbacks. This is due to a [feature](https://github.com/jashkenas/coffee-script/issues/1438) of the `coffee` executable. 

In order to get round this you can compile the coffeescript file into a javascript file by running `coffee -c filename.coffee` and then running `node filename.js` to execute your app. This is automatable if you use a [Cakefile](http://coffeescript.org/documentation/docs/cake.html), or you can use [Grunt](http://gruntjs.com/).


Send Non-Fatal Exceptions to Bugsnag
------------------------------------

If you would like to send non-fatal exceptions to Bugsnag, you can pass any `Error` object or string to the `notify` method:

```javascript
bugsnag.notify(new Error("Non-fatal"));
```

You can also send additional meta-data with your exception:

```javascript
bugsnag.notify(new Error("Non-fatal"), {extraData:{username:"bob-hoskins"}});
```

See the full documentation for the [notify](#notify) function for more details.

Capturing All Errors
--------------------

For bugsnag to be notified of all uncaught exceptions and unhandled error event emmiter events, you should use 'autoNotify' to wrap your code. This will wrap the enclosing code in a [domain](http://nodejs.org/api/domain.html)

```javascript
bugsnag.autoNotify(function(){
	// Here bugsnag will be notified of all uncaught exceptions and unhandled 'error' 
	// event emitter events.
});

Bugsnag can also intercept the first argument of a callback using `bugsnag.intercept`, replacing the boilerplate `if(err) return bugsnag.notify(err);` everywhere. This works in a similar manner to [domain.intercept](http://nodejs.org/api/domain.html#domain_domain_intercept_callback).

```javascript
functionWithCallback(bugsnag.intercept(function(argument){
	// This callback will only be called if functionWithCallback did not pass an error
	// as the first argument to the callback function. If it does pass an error, the callback
	// wont be called and bugsnag will be notified of the error.
}));
```

Register
-------------

The bugsnag.register takes an optional second parameter, containing an object of options. The options can be a combination of any of the following.

###releaseStage

By default, bugsnag looks at the NODE_ENV environment variable to see what releaseStage the script is running in. If that is not set, bugsnag assumes you are running in production. If you want to override this behavior, set the releaseStage as part of the call to register.

```javascript
bugsnag.register("your-api-key-goes-here",{releaseStage:"development"});
```

###notifyReleaseStages

By default the notifier will only notify bugsnag of production exceptions. If you wish to be notified about development exceptions, then you can set the notifyReleaseStages option.

```javascript
bugsnag.register("your-api-key-goes-here",{notifyReleaseStages:["development", "production"]});
```

###appVersion

The bugsnag notifier will look for a package.json file in the root of the project and pull the application version from that file. If this behavior is incorrect, you can pass an appVersion into register to set your own custom version.

```javascript
bugsnag.register("your-api-key-goes-here",{appVersion:"1.0.0"});
```

###autoNotifyUncaught

Bugsnag will automatically register for the uncaughtexception event. If you do not wish for this to happen, you can disable the functionality as part of the register call.

```javascript
bugsnag.register("your-api-key-goes-here",{autoNotifyUncaught:false});
```

###projectRoot

Bugsnag highlights stacktrace lines that are in your project for you, and automatically hides code that is in third party libraries. If bugsnag is not hiding stacktrace lines in third party libraries, it is likely that the projectRoot is being incorrectly calculated. You can set it when calling register to a path relative to the bugsnag.js file or an absolute path.

```javascript
bugsnag.register("your-api-key-goes-here",{projectRoot:"../../../"});
```

###packageJSON

If the bugsnag notifier is unable to locate your package JSON file, you can pass in either a fully qualified path, or a path relative to the location of the bugsnag.js file to the register method. If your package.json file is in your project root, this is usually unnecessary.

```javascript
bugsnag.register("your-api-key-goes-here",{packageJSON:"../../../package.json"});
```

###useSSL

Bugsnag will automatically notify bugsnag.com of an exception using SSL. If you do not want this encryption, you can disable it here.

```javascript
bugsnag.register("your-api-key-goes-here",{useSSL:false});
```

Notify
-------------

The `notify` function accepts an error as either a string or an Error object as the first argument. It then also accepts the following other optional arguments.

###errorClass

Bugsnag will use any errorClass option as the class of error that is being notified. This means that you don't have to subclass the `Error` class when trying to send custom errors.

```javascript
// Will show up in the Bugsnag dashboard as a "BadError" error
bugsnag.notify(new Error("Something went badly wrong"), {errorClass:"BadError"});
```

###context

Bugsnag will use any context passed into the notify method when notifying bugsnag of the exception. You can set this option to any string value, and you will be able to see the that this error came from the supplied context on the web dashboard.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {context:"/users/new"});
```

###userId

Bugsnag will use any userId passed into the notify method when notifying bugsnag of the exception. You can set this option to any string value and bugsnag will use that to count users affected.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {userId: "bob-hoskins"});
```

###req

Bugsnag can also pull the context (URL) and userID (remote IP address) from the node.js request object if you pass that in to the notify method.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {req: req});
```

The notifier will also pull out extra information about the request to help you diagnose the exception if you pass the request to the notify method.

###metaData

Bugsnag can also send any extra data you want along with the exception report to bugsnag. To do this just set other properties on the object, and you will see them as tabs in the error dashboard.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {tabName: {username:"bob-hoskins"}});
```

###callback

Bugsnag will also call a callback after it has finished notifying bugsnag of an error if you wish. The callback has two arguments, `error` and `response`. The `error` callback will contain any error received when trying to send the notification to bugsnag and the `response` object will contain the response received from bugsnag.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), function(error, response){
	// here error is any error generated while trying to send the notification to bugsnag
	// and response is the actual response received from bugsnag, as a string
	if(err) {
    //Something went wrong
  } else {
  	//The notify worked
  }
})


Configuration
-------------

###context

Bugsnag uses the concept of "contexts" to help display and group your exceptions. Contexts represent what was happening in your application at the time an exception occurs. In a network based node app, this would typically be the URL requested. If you provide access to the node.js request object, bugsnag will use the URL for you.

If you would like to set the bugsnag context manually, you can set `context`:

```javascript
bugsnag.context = "/images/1.png";
```

**Note:** The context here can be overridden when calling bugsnag.notify.

###userId

Bugsnag helps you understand how many of your users are affected by each exception. In order to do this, we send along a userId with every exception. If you provide access to the node.js request object, bugsnag will use the remote IP address to identify the user.
    
If you would like to override this `userId`, for example to set it to be a username of your currently logged in user, you can set `userId`:

```javascript
bugsnag.userId = "leeroy-jenkins";
```

**Note:** The userId here can be overridden when calling bugsnag.notify.

###metaData

It is often very useful to send some extra application or user specific data along with every exception. To do this, you can set the `metaData`:
    
```javascript
bugsnag.metaData.tabName = {username: "bob-hoskins"};
```


Reporting Bugs or Feature Requests
----------------------------------

Please report any bugs or feature requests on the github issues page for this project here:

<https://github.com/bugsnag/bugsnag-node/issues>


Contributing
------------

-   [Fork](https://help.github.com/articles/fork-a-repo) the [notifier on github](https://github.com/bugsnag/bugsnag-node)
-   Commit and push until you are happy with your contribution. Please only edit the coffeescript files.
-   [Make a pull request](https://help.github.com/articles/using-pull-requests)
-   Thanks!


License
-------

The Bugsnag Node.js notifier is free software released under the MIT License.  See [LICENSE.txt](https://github.com/bugsnag/bugsnag-node/blob/master/LICENSE.txt) for details.