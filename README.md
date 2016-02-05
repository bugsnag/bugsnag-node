Bugsnag Notifier for Node.js
============================

The Bugsnag Notifier for Node.js automatically notifies you of synchronous and asynchronous errors in your Node.js applications.

[Bugsnag](http://bugsnag.com) captures errors in real-time from your web, mobile and desktop applications, helping you to understand and resolve them as fast as possible. [Create a free account](http://bugsnag.com) to start capturing errors from your applications.


Installation & Setup
--------------------

Install bugsnag using npm:

```bash
npm install bugsnag --save
```

Require bugsnag in your node.js app:

```javascript
var bugsnag = require("bugsnag");
```

Register the bugsnag notifier with your API key:

```javascript
bugsnag.register("your-api-key-here");
```

See below for [additional configuration options](#configuration).


Using Express or Connect Middleware
-----------------------------------

If your app uses [Express](http://expressjs.com/) or [Connect](http://www.senchalabs.org/connect/), Bugsnag can automatically capture errors that happen during requests, including errors that happen in asynchronous code.

To ensure that asynchronous errors are routed to the error handler, add the `requestHandler` middleware to your app as the **first middleware**:

```javascript
app.use(bugsnag.requestHandler);
```

You'll also need to add Bugsnag's error handling middleware, make sure to add this after all other middleware, but before any "error" middleware:

```javascript
app.use(bugsnag.errorHandler);
```

Using Restify
-------------

If your app uses [Restify](http://mcavage.me/node-restify/), Bugsnag can automatically capture errors that happen during requests.

To get notified of the errors in your app, just add the Bugsnag restify handler to your code.

```javascript
server.on("uncaughtException", bugsnag.restifyHandler);
```

If you don't use any other uncaughtException event listeners, you will need to add the default handler
back in, like this.

```javascript
server.on("uncaughtException", function (req, res, route, e) {
  if (!res._headerSent) res.send(new restify.InternalError(e, e.message || 'unexpected error'));
});
```

Using Koa
----------

If your app uses [Koa](http://koajs.com/), Bugsnag can automatically capture errors that happen during requests.

To get notified of the errors in your app, just add the Bugsnag koa handler to your code.

```javascript
app.on("error", bugsnag.koaHandler)
```


Using Coffeescript
------------------

When executing coffeecript code directly using the `coffee` executable, Bugsnag cannot notify about uncaught exceptions that occur at the top level of your app as [the `coffee` executable wraps modules in a try/catch](https://github.com/jashkenas/coffeescript/issues/1438).

To avoid this issue, make sure to compile your coffeescript files into javascript before running your app.


Using Promises
--------------

If you're using a promises library such as Bluebird or when.js, you can listen to unhandled promise rejections.
See [this document](https://gist.github.com/benjamingr/0237932cee84712951a2) for more details.

```javascript
process.on('unhandledRejection', function (err, promise) {
    console.error("Unhandled rejection: " + (err && err.stack || err));
    bugsnag.notify(err);
});
```

Send Non-Fatal Exceptions to Bugsnag
------------------------------------

To send non-fatal exceptions to Bugsnag, you can pass any `Error` object or string to the `notify` method:

```javascript
bugsnag.notify(new Error("Non-fatal"));
```

You can also send additional meta data with your exception:

```javascript
bugsnag.notify(new Error("Non-fatal"), {
  user: {
    username: "bob-hoskins",
    name: "Bob Hoskins",
    email: "bob@example.com"
  }
});
```

### Severity

You can set the severity of an error in Bugsnag by including the severity option when
notifying bugsnag of the error,

```javascript
bugsnag.notify(new Error("Non-fatal"), {
  severity: "error"
})
```

Valid severities are `error`, `warning` and `info`.

Severity is displayed in the dashboard and can be used to filter the error list.
By default all crashes (or unhandled exceptions) are set to `error` and all
`bugsnag.notify` calls default to `warning`.

See the full documentation for the [notify](#notify) function for more details.


Capturing Asynchronous Errors
-----------------------------

Bugsnag can automatically capture both synchronous and asynchronous errors in your code if you wrap it in an `autoNotify` function. *Note: If you are using the `bugsnag.requestHandler` middleware for Express or Connect, we automatically wrap your requests with `autoNotify`.*

```javascript
bugsnag.autoNotify(function() {
  // Your code here
});
```

Additionally, you can pass options into `autoNotify` that will be used as default options for the notify call to any errors. See the [notify](#notify) docs for more details.

```javascript
bugsnag.autoNotify({ context: "thisContext" }, function() {
  // Your code here
});
```

The `autoNotify` function creates a Node.js [`Domain`](http://nodejs.org/api/domain.html) which automatically routes all uncaught errors to Bugsnag.


Capturing Errors in Callback Functions
--------------------------------------

Many callback functions in Node are called with an error as the first argument. Bugsnag can intercept these errors if you wrap your callback with  `bugsnag.intercept`:

```javascript
functionWithCallback(bugsnag.intercept(function(argument) {
  // Your code here
}));
```

If the first argument is non-null, Bugsnag will be automatically notified of the error, and your callback will not be executed. The first argument is never passed to your callback, since it is assumed to be the error argument.


Configuration
-------------

The `bugsnag.register` can accept an options object as its second parameter. The options can be a combination of any of the following:

### releaseStage

By default, Bugsnag looks at the NODE_ENV environment variable to see what releaseStage the script is running in. If that is not set, Bugsnag assumes you are running in production. If you want to override this behavior, you can set the `releaseStage` option:

```javascript
bugsnag.register("your-api-key-here", { releaseStage: "development" });
```

### notifyReleaseStages

By default the notifier will notify Bugsnag of production and development exceptions. If you wish to be notified about production exceptions only, you can set the `notifyReleaseStages` option.

```javascript
bugsnag.register("your-api-key-here", { notifyReleaseStages: ["production"] });
```

### appVersion

If you use an appVersion to identify releases of your app you can send it to Bugsnag. When set errors will only unresolve when they re-occur in a newer appVersion.

```javascript
bugsnag.register("your-api-key-here", { appVersion: "1.0.0" });
```

### autoNotify

Bugsnag will automatically register for the `uncaughtexception` event. If you do not wish for this to happen, you can disable the functionality as part of the register call:

```javascript
bugsnag.register("your-api-key-here", { autoNotify: false });
```

<!-- Custom anchor for linking from alerts -->
<div id="set-project-root"></div>
### projectRoot

Bugsnag can highlight stacktrace lines that are in your project, and automatically hides stacktrace lines from external libraries. If Bugsnag is not hiding external stacktrace lines, it is likely that the `projectRoot` is being incorrectly calculated. You can set `projectRoot` as part of the register call:

```javascript
bugsnag.register("your-api-key-here", { projectRoot: "/path/to/root" });
```

### packageJSON

If the Bugsnag notifier is unable to locate your `package.json`, you can specify where to find it using `packageJSON`:

```javascript
bugsnag.register("your-api-key-here", { packageJSON: "/path/to/package.json" });
```

### useSSL

By default, errors will be sent to Bugsnag using SSL. To disable SSL, you can set `useSSL`:

```javascript
bugsnag.register("your-api-key-here", { useSSL: false });
```

### onUncaughtError

By default, bugsnag will exit your application if there is an uncaught exception or an uncaught event emitter "error" event. This is in line with standard node.js behaviour. If you want to have different behaviour, then please set onUncaughtError as follows,

```javascript
bugsnag.register("your-api-key-here", { onUncaughtError: function(err){
  console.error(err.stack || err);
}});
```

This function is called for all errors that aren't manually sent to bugsnag.notify. So a bugsnag.intercept call will trigger a call to onUncaughtError.

### metaData

It is often very useful to send some extra application or user specific data along with every exception. To do this, you can set the `metaData`:

```javascript
bugsnag.register("your-api-key-here", { metaData: {
  user: {
    username: "bob-hoskins",
    name: "Bob Hoskins",
    email: "bob@example.com"
  }
}});
```

You can adjust this after calling register by using the `bugsnag.metaData` property.

### proxy

You can use a proxy server by configuring a proxy url when registering with bugsnag.

```javascript
bugsnag.register("your-api-key-here", { proxy: "http://localhost:8080" });
```

### filters

You can prevent some meta-data keys (such as passwords) from being sent to Bugsnag by listing
them in the filters. This is most useful if you're sending request data and don't want to
accidentally log a user's password. The keys are matched with substring matching, so the default
value of `["password"]` also excludes things like `"password_confirmation"`.

```javascript
bugsnag.register("your-api-key-here", { filters: ["password", "creditcard"] }
```

### hostname

By default we'll fetch the hostname using Node's [os.hostname()](https://nodejs.org/api/os.html#os_os_hostname), but you can override this as follows:

```javascript
bugsnag.register("your-api-key-here", { hostname: "web1.example.com" }
```

### onBeforeNotify

If you want to modify error reports just before they are sent to Bugsnag, or prevent them from being sent,
you can add before notify callbacks:

```javascript
Bugsnag.onBeforeNotify(function (notification) {

    var metaData = notification.events[0].metaData;

    // modify meta-data
    metaData.app = {version: '0.3'}

    // Don't log error reports from admins
    if (metaData.user.is_admin) {
        return false;
    }
});
```

You can add multiple beforeNotify callbacks, they'll be called in the order you add them.

### sendCode

If you want to send code snippets for each frame of the stacktrace you can enable `sendCode`. This asynchronously loads
any file from the stacktrace, which is within the scope of the project, and sends 3 lines either side of the erroneous line
of code to Bugsnag.

This works almost the same as how Bugsnag JavaScript projects handle sourcemaps - however loading the code is done on the
local machine and sent over the internet with the error data.

```javascript
bugsnag.register("your-api-key-here", { sendCode: true });
```

Notify
------

The `bugsnag.notify` function accepts an error as either a string or an Error object as the first argument, as well as options object as its second parameter. The options can be a combination of any of the following:

### errorName

Errors in your Bugsnag dashboard are grouped by their "error class", to override the error class you can set `errorName`:

```javascript
bugsnag.notify(new Error("Something went badly wrong"), { errorName: "BadError" });
```

### context

A string representing what was happening in your application at the time of the error. In Express/Connect apps, this will automatically be set to the URL of the current request.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), { context: "/users/new" });
```

### userId

A unique identifier for a user affected by this error. This could be any distinct identifier that makes sense for your application. In Express/Connect apps, this is automatically set to the ip address of the current request.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), { userId: "bob-hoskins" });
```

### groupingHash

If you need programmatical control over how the errors are grouped within bugsnag, you can send a groupingHash to the notify call. This will ensure that bugsnag groups all errors with the same groupingHash together.

```javascript
bugsnag.notify(error, { groupingHash: "auth/create" });
```

### metaData

Any extra data you want along with the exception report to Bugsnag. To do this just set other properties on the object, and you will see them as tabs in the error dashboard.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {
  user: {
    username: "bob-hoskins",
    name: "Bob Hoskins",
    email: "bob@example.com"
  }
});
```

### severity

You can set the severity of an error in Bugsnag by including the severity option when
notifying bugsnag of the error,

```ruby
bugsnag.notify(new Error("Non-fatal"), {
  severity: "error"
})
```

Valid severities are `error`, `warning` and `info`.

Severity is displayed in the dashboard and can be used to filter the error list.
By default all crashes (or unhandled exceptions) are set to `error` and all
`Bugsnag.notify` calls default to `warning`.

### callback

A callback to call after notifying Bugsnag of an error. The callback has two arguments, `err` and `response`. The `err` argument will contain any error received when trying to send the notification, the `response` object will contain the response received from Bugsnag:

```javascript
bugsnag.notify(new Error("Something went badly wrong"), function (error, response) {
  if(error) {
    // Something went wrong
  } else {
    // The notify worked
  }
})
```

Per-request metaData
--------------------

If you are using our express middleware, or otherwise using domains, you can set per-request metaData.
This metaData will be sent with any crashes occurring during the current request.

```javascript
bugsnag.requestData.user = {id: 5}
```

Reporting Bugs or Feature Requests
----------------------------------

Please report any bugs or feature requests on the github issues page for this project here:

<https://github.com/bugsnag/bugsnag-node/issues>


Contributing
------------

We love pull requests and issues. See [CONTRIBUTING.md](https://github.com/bugsnag/bugsnag-node/blob/master/CONTRIBUTING.md) for instructions :).

License
-------

The Bugsnag Node.js notifier is free software released under the MIT License.  See [LICENSE.txt](https://github.com/bugsnag/bugsnag-node/blob/master/LICENSE.txt) for details.
