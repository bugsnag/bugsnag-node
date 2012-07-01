Official Bugsnag Notifier for Node.js
=====================================

The Bugsnag Notifier for Node.js is designed to give you
instant notification of errors from your Node.js applications. 
By default, the notifier hooks into `uncaughtException` event, which means any 
uncaught exceptions will trigger a notification to be sent to your Bugsnag
project.


What is Bugsnag?
----------------

[Bugsnag](http://bugsnag.com) captures errors in real-time from your web, 
mobile and desktop applications, helping you to understand and resolve them 
as fast as possible. [Create a free account](http://bugsnag.com).


Features
--------

-   Automatic notification of uncaught exceptions
-   Send your own [non-fatal exceptions](#send-non-fatal-exceptions-to-bugsnag)
    to Bugsnag
-   Minimal CPU and memory footprint.
-   Track which users and urls were affected by an exception.
-   Optional integration with connect/express middleware to give your errors
    context from the request.
-   Send additional meta-data along with your exceptions using 
    [`setExtraData`](#setextradata)
-   Filter sensitive data before sending exceptions with
    [`setFilters`](#setfilters)


Installation & Setup
--------------------

Add bugsnag to your package.json dependencies.

```javascript
"dependencies": {
    "bugsnag": "latest"
}
```

Run npm install to install the latest bugsnag notifier version.

```bash
npm install
```

Require bugsnag in your node.js script.

```javascript
bugsnag = requre("bugsnag");
```

Register the bugsnag notifier.

```javascript
bugsnag.register("your-api-key-goes-here");
```

See the ['full documentation'](#register) for the register function below.


Using Express or Connect Middleware
-----------------------------------------

In order to have bugsnag report on any errors in your express
or connect app, you need to configure bugsnag to handle errors
from within those libraries. In order to do that, simply pass
the bugsnag register call into app.use().

```javascript
app.use(bugsnag.register("your-api-key-goes-here"))
```

**Note:** Please pay attention to the order of your middleware
calls. Bugsnag's error middleware should ideally be the first
middleware run after the request has been processed.


Send Non-Fatal Exceptions to Bugsnag
------------------------------------

If you would like to send non-fatal exceptions to Bugsnag, you can pass any
`Error` object or string to the `notify` method:

```javascript
bugsnag.notify(new Error("Non-fatal"));
```

You can also send additional meta-data with your exception:

```javascript
bugsnag.notify(new Error("Non-fatal"), {username:"bob-hoskins"});
```

###Manual Error Class

If you would like to set the class of error that has been raised,
you can call the `notifyWithClass` method:

```javascript
bugsnag.notifyWithClass("RuntimeError", new Error("Non-fatal"));
```


Register
-------------

The bugsnag.register takes an optional second parameter, containing a Hash of
options. The options can be a combination of any of the following.

###releaseStage

By default, bugsnag looks at the NODE_ENV environment variable to see what releaseStage
the script is running in. If that is not set, bugsnag assumes you are running in production.
If you want to override this behavior, set the releaseStage as part of the call to register.

```javascript
bugsnag.register("your-api-key-goes-here",{releaseStage:"development"});
```

###appVersion

The bugsnag notifier will look for a package.json file in the root of the project and pull
the application version from that file. If this behavior is incorrect, you can pass an appVersion
into register to set your own custom version.

```javascript
bugsnag.register("your-api-key-goes-here",{appVersion:"1.0.0"});
```

###packageJSON

If the bugsnag notifier is unable to locate your package JSON file, you can pass in either a fully
qualified path, or a path relative to the location of the bugsnag.js file to the register method.

```javascript
bugsnag.register("your-api-key-goes-here",{packageJSON:"../../../package.json"});
```

###autoNotify

Bugsnag will automatically register for the uncaughtexception event. If you do not wish for this
to happen, you can disable the functionality as part of the register call.

```javascript
bugsnag.register("your-api-key-goes-here",{autoNotify:false});
```

###notifyReleaseStages

By default the notifier will only notify bugsnag of production errors. If you wish to be notified
about development errors, then you can set the notifyReleaseStages option.

```javascript
bugsnag.register("your-api-key-goes-here",{notifyReleaseStages:["development", "production"]});
```

###enableSSL

Bugsnag supports the SSL encryption of error reports. If you require this level of security, you can
enable SSL support within the notifier.

```javascript
bugsnag.register("your-api-key-goes-here",{enableSSL:true});
```

###projectDirectory

Bugsnag highlights stacktrace lines that are in your project for you, and automatically hides code that 
is in third party libraries. If bugsnag is not hiding stacktrace lines in third party libraries, it is
likely that the projectDirectory is being incorrectly calculated. You can set it when calling register to
a path relative to the bugsnag.js file or an absolute path.

```javascript
bugsnag.register("your-api-key-goes-here",{projectDirectory:"../../../"});
```

Notify
-------------

Both `notify` and `notifyWithClass` take an optional final hash parameter that provides bugsnag with more
information as to what was happening in the node script when the error occurred.

###context

Bugsnag will use any context passed into the notify method when notifying bugsnag of the error. You can
set this option to any string value, and you will be able to see the context aggregated in the web dashboard.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {context:"/users/new"});
```

###userId

Bugsnag will use any userId passed into the notify method when notifying bugsnag of the error. You can
set this option to any string value and bugsnag will use that to count users affected.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {userId: "bob-hoskins"});
```

###req

Bugsnag can also pull the context (URL) and userID (remote IP address) from the node.js request object
if you pass that in to the notify method.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {req: req});
```


Configuration
-------------

###setContext

Bugsnag uses the concept of "contexts" to help display and group your
errors. Contexts represent what was happening in your application at the
time an error occurs. In a network based node app, this would typically
be the URL requested. If you provide access to the node.js request object, 
bugsnag will use the URL for you.

If you would like to set the bugsnag context manually, you can call 
`setContext`:

```javascript
bugsnag.setContext("/images/1.png");
```

**Note:** The context here can be overridden when calling bugsnag.notify or
bugsnag.notifyWithClass.

###setUserId

Bugsnag helps you understand how many of your users are affected by each
error. In order to do this, we send along a userId with every exception. 
If you provide access to the node.js request object, bugsnag will use the
remote IP address to identify the user.
    
If you would like to override this `userId`, for example to set it to be a
username of your currently logged in user, you can call `setUserId`:

```javascript
bugsnag.setUserId("leeroy-jenkins");
```

**Note:** The userId here can be overridden when calling bugsnag.notify or
bugsnag.notifyWithClass.

###setExtraData

It is often very useful to send some extra application or user specific 
data along with every exception. To do this, you can call the
`setExtraData` method:
    
```javascript
bugsnag.setExtraData({username: bob-hoskins});
```


Reporting Bugs or Feature Requests
----------------------------------

Please report any bugs or feature requests on the github issues page for this
project here:

<https://github.com/bugsnag/bugsnag-node/issues>


Contributing
------------
 
-   Check out the latest master to make sure the feature hasn't been 
    implemented or the bug hasn't been fixed yet
-   Check out the issue tracker to make sure someone already hasn't requested
    it and/or contributed it
-   Fork the project
-   Start a feature/bugfix branch
-   Commit and push until you are happy with your contribution
-   Thanks!


License
-------

The Bugsnag node.js notifier is released under the 
MIT License. Read the full license here:

<https://github.com/bugsnag/bugsnag-node/blob/master/LICENSE>