### Deprecation notice

We upgraded our Node support in the latest all-in-one javascript notifier package. Check out the [blog post](https://blog.bugsnag.com/bugsnag-universal-js/) for more info.

All projects should **upgrade to our universal JS notifier:** [@bugsnag/js](https://github.com/bugsnag/bugsnag-js). See the [upgrade guide](https://github.com/bugsnag/bugsnag-js/blob/master/UPGRADING.md) for details on how to upgrade.

This package is now deprecated, but will continue to exist on the npm registry and work with Bugsnag's API for the foreseeable future. However, it will no longer receive updates unless they are critical.

Please upgrade at your earliest convenience.

---

# Bugsnag error reporter for Node.js
[![Build Status](https://travis-ci.org/bugsnag/bugsnag-node.svg)](https://travis-ci.org/bugsnag/bugsnag-node)

Automatically detect synchronous and asynchronous errors in your Node.js apps,
collect diagnostic information, and receive notifications immediately.

Learn more about [error reporting](https://www.bugsnag.com/) with Bugsnag.

## Features

* Automatically report synchronous and asynchronous errors
* Report handled errors
* Attach user information to determine how many people are affected by a crash
* Send customized diagnostic data

## Getting started

1. [Create a Bugsnag account](https://www.bugsnag.com)
2. Complete the instructions in the integration guide for your framework:
    * [Express or Connect](https://docs.bugsnag.com/platforms/nodejs/express)
    * [Koa](https://docs.bugsnag.com/platforms/nodejs/koa)
    * [Restify](https://docs.bugsnag.com/platforms/nodejs/restify)
    * [Other Node.js apps](https://docs.bugsnag.com/platforms/nodejs/other)
3. Relax!

## Support

* Read the configuration reference:
    * [Express or Connect](https://docs.bugsnag.com/platforms/nodejs/express/configuration-options)
    * [Koa](https://docs.bugsnag.com/platforms/nodejs/koa/configuration-options)
    * [Restify](https://docs.bugsnag.com/platforms/nodejs/restify/configuration-options)
    * [Other Node.js apps](https://docs.bugsnag.com/platforms/nodejs/other/configuration-options)
* [Search open and closed issues](https://github.com/bugsnag/bugsnag-node/issues?utf8=✓&q=is%3Aissue) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag-node/issues/new)

## Contributing

All contributors are welcome! For information on how to build, test
and release `bugsnag-node`, see our
[contributing guide](https://github.com/bugsnag/bugsnag-node/blob/master/CONTRIBUTING.md).

## License

The Bugsnag error reporter for Node.js is free software released under the MIT
License.  See
[LICENSE.txt](https://github.com/bugsnag/bugsnag-node/blob/master/LICENSE.txt)
for details.
