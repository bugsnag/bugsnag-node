Changelog
=========

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
