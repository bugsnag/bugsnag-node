Changelog
=========

## 2.4.3 (2018-06-22)

### Fixed
- Add missing `app` properties to session payload (#150)

## 2.4.2 (2018-06-12)

### Fixed
- Make updated types compatible with `noImplicitAny` option (#147) (@jacobwgillespie)

## 2.4.1 (2018-06-07)

### Fixed
- TypeScript definitions updated to match current configuration options (#144) (@amrocha)

## 2.4.0 (2018-06-01)

**Note**: this release alters the behaviour of the notifier to track sessions automatically.

As part of this change, the way in which URLs are configured has been updated:

```diff
- useSSL: true,
- notifyHost: 'bugsnag-notify.example.com',
- notifyPort: 9876
- notifyPath: '/payloads'
- sessionEndpoint: 'https://bugsnag-sessions.example.com',
+ endpoints: {
+  notify: 'https://bugsnag-notify.example.com:9876/payloads',
+  sessions: 'https://bugsnag-sessions.example.com'
+ }
```

`useSSL`, `notifyHost`, `notifyPort`, `notifyPath` and `sessionEndpoint` are now deprecated but still supported. Note that session tracking will be disabled if the notify endpoint is configured but the sessions endpoint is not – this is to avoid inadvertently sending session payloads to the wrong server.

### Added
- Unit tests have been added for `lib/configuration.js` (#143)

### Changed
- `autoCaptureSessions` default value was `false` and is now true (#143)
- The interval used to send periodic session summaries now has [`unref()`](https://nodejs.org/api/timers.html#timers_timeout_unref) called on it, to avoid keeping a process running that would otherwise terminate (#143)

### Deprecated
- `useSSL`, `notifyHost`, `notifyPort`, `notifyPath` and `sessionEndpoint` have been deprecated and combined into a single new option: `endpoints` (#143)

## 2.3.1 (2018-03-15)

### Enhancements

* Support configuration of appType [#139](https://github.com/bugsnag/bugsnag-node/pull/139), fixes [#126](https://github.com/bugsnag/bugsnag-node/issues/126)
* Improve logging clarity for unhandled exceptions [#137](https://github.com/bugsnag/bugsnag-node/pull/137)

## 2.3.0 (2018-03-01)

### Enhancements

* Improve serialization of class-based data structures which expose a `.toJSON()` method [#134](https://github.com/bugsnag/bugsnag-node/pull/134)

## 2.2.0 (2018-02-22)

### Enhancements

* Apply `Configuation.filters` to all aspects of the payload that can contain custom data [#131](https://github.com/bugsnag/bugsnag-node/pull/131)

### Bug fixes

* Don't call `req.connection.address()` in `requestInfo()` if it's not available (to support express-like [`serverless-http`](https://github.com/dougmoscrop/serverless-http) framework) [Julien Guépin](https://github.com/jguepin) [#132](https://github.com/bugsnag/bugsnag-node/pull/132)

## 2.1.3 (2018-01-25)

### Bug fixes

* Reverted a payload change which made the notifier not backwards compatible with older versions of Bugsnag On-premise [#128](https://github.com/bugsnag/bugsnag-node/pull/128)

## 2.1.2 (2018-01-09)

### Enhancements

* Migrate option name `sessionTrackingEnabled` -> `autoCaptureSessions` for consistency with other notifiers
* Session reporting now respects the `notifyReleaseStages` and will only send if error reports will

## 2.1.1 (2018-01-08)

### Bug fixes

* The runtime dependency "backo" was in `devDependencies` in package.json. It has been moved to `dependencies` (fixes #125).

## 2.1.0 (2018-01-08)

### Enhancements

* Support for tracking sessions and overall crash rate of web requests by setting `sessionTrackingEnabled` to `true`.

### Bug fixes

* Prevent duplicate logging when uncaught error report is not delivered (#124)

## 2.0.1 (2017-10-23)

### Bug fixes

* Fix type annotations
  [Dan Prince](https://github.com/danprince).
  [#118](https://github.com/bugsnag/bugsnag-node/pull/118)
* Fix `autoNotifyUnhandledRejection` option

## 2.0.0 (2017-10-02)

### Enhancements

* Handle [`process#unhandledRejection`](https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_event_unhandledrejection)
  by default.
  ([#115](https://github.com/bugsnag/bugsnag-node/pull/115))
* Added support for detecting whether an error was handled or unhandled.
  ([#116](https://github.com/bugsnag/bugsnag-node/pull/116))

### Notes

Bugsnag will shut down your process after reporting a [`process#unhandledRejection`](https://nodejs.org/dist/latest-v8.x/docs/api/process.html#process_event_unhandledrejection)
event. This is the most sensible thing to do by default, and it will become the
default behaviour of a node process in the near future. However this is a breaking
change for the module, hence the major/breaking version bump.

If you want to do something else when `process#unhandledRejection` happens, you
can set `options.autoNotifyUnhandledRejection=false`.

## 1.12.2 (2017-09-13)

### Bug fixes

* Handle and report invalid `notify(err)` argument. Fixes
  [#110](https://github.com/bugsnag/bugsnag-node/issues/110).
  [#114](https://github.com/bugsnag/bugsnag-node/pull/114)

## 1.12.1 (2017-09-01)

### Enhancements

* Stop swallowing errors when `shouldNotify() == false`
  [Alex Moinet](https://github.com/Cawllec)
  [#113](https://github.com/bugsnag/bugsnag-node/pull/113)

## 1.12.0 (2017-08-02)

### Enhancements

* Improved performance during filtering
  [Patrick Lorio](https://github.com/loriopatrick)
  [#106](https://github.com/bugsnag/bugsnag-node/pull/106)

* Show metadata elements removed within circular reference checking as
  `[REDACTED]`
  [#108](https://github.com/bugsnag/bugsnag-node/pull/108)

* Add support for passing per-request metadata in Koa
  [Jacob Marshall](https://github.com/jacobmarshall)

* Allow newer versions of `stack-trace` dependency
  [Kevin Glowacz](https://github.com/kjg)
  [#100](https://github.com/bugsnag/bugsnag-node/pull/106)

### Bug fixes

* Update `request` minimum version to fix `tunnel-agent` vulnerability
  [Jacob Marshall](https://github.com/jacobmarshall)
  [#105](https://github.com/bugsnag/bugsnag-node/pull/105)

## 1.11.0 (2017-06-08)

### Enhancements

* Add the error which caused a report to be generated as a parameter to
  `beforeNotifyCallbacks`.
  [#101](https://github.com/bugsnag/bugsnag-node/issues/101)
  [#103](https://github.com/bugsnag/bugsnag-node/pull/103)

## 1.10.0 (2017-04-06)

### Enhancements

* Add typescript definitions
  [Iker Pérez Brunelli](https://github.com/DarkerTV)
  [#97](https://github.com/bugsnag/bugsnag-node/pull/97)

## 1.9.1 (2017-02-24)

### Bug Fixes

* Fix premature return in configure, leading to `sendCode` not being updated
  [Jacob Marshall](https://github.com/jacobmarshall)
  [#92](https://github.com/bugsnag/bugsnag-node/pull/92)

## 1.9.0 (2016-11-07)

### Enhancements

* Added `createErrorHandler` and `createRequestHandler` express middleware factories
  [Jonathan Samines](https://github.com/jonathansamines)
  [#88](https://github.com/bugsnag/bugsnag-node/pull/88)

## 1.8.0 (2016-08-26)

### Enhancements

* Add option to set custom headers
  [#83](https://github.com/bugsnag/bugsnag-node/pull/83)
* Use `error.name` instead of `error.constructor.name` where available
  [Jyrki Laurila](https://github.com/jylauril)
  [#77](https://github.com/bugsnag/bugsnag-node/pull/77)
* Invoke notify callback with errors
  [Jacob Marshall](https://github.com/jacobmarshall)
  [#80](https://github.com/bugsnag/bugsnag-node/pull/80)

### Bug Fixes

* Fix setting default project root when `require.main.filename` does not exist
* Clone objects before filtering to avoid modifying referenced objects
  [Percy Hatcherson](https://github.com/primitive-type)
  [#82](https://github.com/bugsnag/bugsnag-node/pull/82)
* Remove duplicated scrubbed metadata from request payloads
  [#72](https://github.com/bugsnag/bugsnag-node/pull/72)


## 1.7.0 (2016-01-27)

### Bug Fixes

* Relax `request` and `promise` dependency requirements to allow patched updates
  [Jakub Pawlowicz](https://github.com/jakubpawlowicz)
  [#70](https://github.com/bugsnag/bugsnag-node/pull/70)
  [#71](https://github.com/bugsnag/bugsnag-node/issues/71)

### Enhancements

* Added support for sending code snippets
  [Jacob Marshall](https://github.com/jacobmarshall)
  [#65](https://github.com/bugsnag/bugsnag-node/issues/65)
  [#67](https://github.com/bugsnag/bugsnag-node/pull/67)

1.6.6
-----
-   Fix for accidental global variables.

1.6.5
-----
-   Koa support

1.6.4
-----
-   Fix objectClone's use of obj.constructor

1.6.3
-----
-   Fix user.id coming in through requestData

1.6.2
-----
-   Expose bugsnag.requestData

1.6.1
-----
-   Support for hostname on more recent versions of express

1.6.0
-----
-   Fix out of memory error caused by bugsnag.requestHandler
-   Convert source code to js
-   Support for Bugsnag.onBeforeNotify
-   Support for passing apiKey to notify

1.5.1
-----
-   Send correct content-length with utf8 strings

1.5.0
-----
-   Allow use of a proxy when communicating with bugsnag

1.4.0
-----
-   Don't send appVersion automatically

1.3.2
-----
-   Push yanked version

1.3.1
-----
-   Allow the filters to be configured
-   Fix bug where null errors could cause bugsnag not to notify
-   Fix iis issues on windows
-   Detect oauth caused by errors

1.3.0
-----
-   Send 'severity' of error to Bugsnag
-   Add 'payloadVersion'

1.2.0
-----
-   Add restify support

1.1.4
-----
-   Send hostname to Bugsnag

1.1.1
-----
-   Fix require.main.filename crash when requiring bugsnag from within cli.

1.1.0
-----
- 	To allow groupingHash to be configured by users to change grouping programmatically.

1.0.3
-----
- 	Fix node 0.8 bug where error.domainThrown is not supported.

1.0.2
-----
-   Fix bug with onUncaughtException not pulled from options properly

1.0.1
-----
-   Improve query string and express app processing.

1.0.0
-----
-   Exit on fatal errors by default, and allow people more control, by using onUncaughtError
-   Protect against adding multiple uncaught error handlers

1.0.0-rc2
---------
-   Detect circular object references and deal with them before notifying bugsnag

1.0.0-rc1
---------
-   Complete rewrite using domains to track requests and other metadata.

0.1.14
------
-   Change default notifyReleaseStages to notify in "development" as well as "production" by default.
-   Execute onUncaughtErrorHandler in the callback from notifyBugsnag, in case exit is called in the handler.
