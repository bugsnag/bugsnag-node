Contributing
============

-   [Fork](https://help.github.com/articles/fork-a-repo) the [notifier on github](https://github.com/bugsnag/bugsnag-node)
-   Build and test your changes
-   Commit and push until you are happy with your contribution
-   [Make a pull request](https://help.github.com/articles/using-pull-requests)
-   Thanks!

Setting up a development environment
====================================

1. Install node

    ```
    brew install node
    ```

1. Install grunt

    ```
    npm install -g grunt
    ```

1. Download the code

    ```
    git clone git@github.com:bugsnag/bugsnag-node
    ```

1. Install the dependencies

    ```
    npm install
    ```

Testing
=======

We use mocha to run the tests, but it's hooked up in `package.json` so that you can run

```
npm test
```

Releasing
=========

If you're a member of the Bugsnag team.

### Getting set up

1. Set up a npm account
1. Get someone to add you as a contributor on bugsnag-node
1. npm adduser (put in your NPM login details, only do this once if your user isnt added)

### Doing a release

1. Update version in package.json.
1. Update the version in `lib/notifier.js`
1. Update the CHANGELOG.md
1. Update the README if required
1. grunt release
1. npm publish

### Update docs.bugsnag.com

Update the setup guides for JavaScript and CoffeeScript with Node with any new
content.
