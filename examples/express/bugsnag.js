const bugsnag = require("../../");

// Here we register the bugsnag client using our project's API key, and optionally pass our
// Bugsnag configuration. For example, we can enable `sendCode` so we're able to see the code
// within our app straight from the Bugsnag error report page.
bugsnag.register("8940fe773e8ce12f07250e4adfd212e7", {
  sendCode: true,
});

module.exports = bugsnag;