const bugsnag = require("../../");

bugsnag.register("8940fe773e8ce12f07250e4adfd212e7", {
  sendCode: true,
});

module.exports = bugsnag;