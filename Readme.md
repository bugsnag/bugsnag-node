# Bugsnag Node Plugin

Node.js client for [bugsnag.com][Bugsnag].

## Install

``` bash
npm install bugsnag
```

## Usage

Typically you will register for all uncaught exceptions to be sent to bugsnag. The following code will send all uncaught exceptions to bugsnag.

``` javascript
var bugsnag = require('bugsnag').register("your api key");
bugsnag.handleExceptions();

throw new Error('Uncaught exception');
```

You can also send an individual error to bugsnag in the following manner.

``` javascript
var bugsnag = require('bugsnag').register("your api key");
bugsnag.handleExceptions();

try {
  throw new Error('Uncaught exception');
} catch(e) {
  bugsnag.notify(e);
}
```

## Advanced Usage

### Application Version

The application version is derived from the package.json associated with your project. If that isn't
sufficient for your needs, it can be set manually using the following API call.

``` javascript
bugsnag.setApplicationVersion("1.1.1");
```

### Uncaught Exception Handler

When bugsnag catches an uncaught exception, by default it logs the exception and exits the process. If
you would prefer different functionality, you can change this behavior by passing a function to bugsnag.
This function will be run after bugsnag has notified bugsnag.com and the exception has been processed.

``` javascript
bugsnag.setUncaughtExceptionHandler(function(){exit(1);})
```