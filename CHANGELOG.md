Changelog
=========

1.0.0-rc1
---------

-   Complete rewrite using domains to track requests and other metadata.

0.1.14
------

-   Change default notifyReleaseStages to notify in "development" as well as "production" by default.
-   Execute onUncaughtExceptionHandler in the callback from notifyBugsnag, in case exit is called in the handler.