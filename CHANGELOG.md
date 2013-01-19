Changelog
=========

0.1.14
------

-   Change default notifyReleaseStages to notify in "development" as well as "production" by default.
-   Execute onUncaughtExceptionHandler in the callback from notifyBugsnag, in case exit is called in the handler.