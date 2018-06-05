const bugsnag = require("./bugsnag");

function attemptLogin(username, password) {
  return new Promise((resolve, reject) => {
    if (username === "crash") {
      // Obviously you wouldn't expect to see this in your production app, but here is an example of what
      // you might have underlying your database abstraction.
      reject(new Error(`Unable to connect to database`));
    } else {
      if (username === password) {
        resolve({
          id: 1,
          name: username,
        });
      } else {
        resolve(null);
      }
    }
  });
}

function loadSession(req, res, next) {
  // We may not always be reporting errors manually. What happens if there's an error we didn't anticipate?
  // In that case we can attach some user data to the request, so we know which user was affected by the error.
  if (bugsnag.requestData) {
    bugsnag.requestData.user = {
      id: 1,
      name: "james",
      plan: "beast-mode",
    };
  }
  next(null);
}

module.exports = {
  attemptLogin,
  loadSession,
};
