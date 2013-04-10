Changelog
=========

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