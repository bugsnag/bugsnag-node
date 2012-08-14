Bugsnag Notifier for Node.js
============================

The Bugsnag Notifier for Node.js gives you instant notification of exceptions
from your Node.js applications. 
By default, the notifier hooks into `uncaughtException` event, which means any 
uncaught exceptions will trigger a notification to be sent to your Bugsnag
project.

[Bugsnag](http://bugsnag.com) captures errors in real-time from your web, 
mobile and desktop applications, helping you to understand and resolve them 
as fast as possible. [Create a free account](http://bugsnag.com) to start 
capturing exceptions from your applications.


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
bugsnag = require("bugsnag");
```

Register the bugsnag notifier.

```javascript
bugsnag.register("your-api-key-goes-here");
```

See the full documentation for the [register](#register) function for more details.


Using Express or Connect Middleware
-----------------------------------

In order to have bugsnag report on any exceptions in your express
or connect app, you need to configure bugsnag to handle exceptions
from within those libraries. In order to do that, simply pass
the bugsnag register call into app.use().

```javascript
app.use(bugsnag.register("your-api-key-goes-here"))
```


Send Non-Fatal Exceptions to Bugsnag
------------------------------------

If you would like to send non-fatal exceptions to Bugsnag, you can pass any
`Error` object or string to the `notify` method:

```javascript
bugsnag.notify(new Error("Non-fatal"));
```

You can also send additional meta-data with your exception:

```javascript
bugsnag.notify(new Error("Non-fatal"), {extraData:{username:"bob-hoskins"}});
```

###Manual Error Class

If you would like to set the class of error that has occurred,
you can call the `notifyWithClass` method:

```javascript
bugsnag.notifyWithClass("RuntimeError", new Error("Non-fatal"));
```


Register
-------------

The bugsnag.register takes an optional second parameter, containing an object of
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

###projectRoot

Bugsnag highlights stacktrace lines that are in your project for you, and automatically hides code that 
is in third party libraries. If bugsnag is not hiding stacktrace lines in third party libraries, it is
likely that the projectRoot is being incorrectly calculated. You can set it when calling register to
a path relative to the bugsnag.js file or an absolute path.

```javascript
bugsnag.register("your-api-key-goes-here",{projectRoot:"../../../"});
```

###packageJSON

If the bugsnag notifier is unable to locate your package JSON file, you can pass in either a fully
qualified path, or a path relative to the location of the bugsnag.js file to the register method.
If your package.json file is in your project root, this is usually unnecessary.

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

By default the notifier will only notify bugsnag of production exceptions. If you wish to be notified
about development exceptions, then you can set the notifyReleaseStages option.

```javascript
bugsnag.register("your-api-key-goes-here",{notifyReleaseStages:["development", "production"]});
```

###useSSL

Bugsnag supports the SSL encryption of exception reports. If you require this level of security, you can
enable SSL support within the notifier.

```javascript
bugsnag.register("your-api-key-goes-here",{useSSL:true});
```


Notify
-------------

Both `notify` and `notifyWithClass` take an optional final object parameter that provides bugsnag with more
information as to what was happening in the node script when the exception occurred.

###context

Bugsnag will use any context passed into the notify method when notifying bugsnag of the exception. You can
set this option to any string value, and you will be able to see the context aggregated in the web dashboard.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {context:"/users/new"});
```

###userId

Bugsnag will use any userId passed into the notify method when notifying bugsnag of the exception. You can
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

The notifier will also pull out extra information about the request to help you diagnose the exception
if you pass the request to the notify method.

###extraData

Bugsnag can also send any extra data you want to be sent along with the exception report to bugsnag. To
do this just set the extraData option to an object containing the information you want to send.

```javascript
bugsnag.notify(new Error("Something went badly wrong"), {extraData: {username:"bob-hoskins"}});
```


Configuration
-------------

###setContext

Bugsnag uses the concept of "contexts" to help display and group your
exceptions. Contexts represent what was happening in your application at the
time an exception occurs. In a network based node app, this would typically
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
exception. In order to do this, we send along a userId with every exception. 
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
bugsnag.setExtraData({username: "bob-hoskins"});
```


Reporting Bugs or Feature Requests
----------------------------------

Please report any bugs or feature requests on the github issues page for this
project here:

<https://github.com/bugsnag/bugsnag-node/issues>


Contributing
------------

-   [Fork](https://help.github.com/articles/fork-a-repo) the [notifier on github](https://github.com/bugsnag/bugsnag-node)
-   Commit and push until you are happy with your contribution
-   [Make a pull request](https://help.github.com/articles/using-pull-requests)
-   Thanks!


License
-------

The Bugsnag Node.js notifier is free software released under the MIT License. 
See [LICENSE.txt](https://github.com/bugsnag/bugsnag-node/blob/master/LICENSE.txt) for details.
