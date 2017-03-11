const bugsnag = require("./bugsnag");

async function attemptLogin(username, password) {
  let user = null;
  if (username === "crash") {
    // Obviously you wouldn't expect to see this in your production app, but here is an example of what
    // you might have underlying your database abstraction.
    throw new Error(`Unable to connect to database`);
  } else {
    if (username === password) {
      user = {
        id: 1,
        name: username,
      };
    }
  }
  return user;
}

async function loadSession(ctx, next) {
  // We may not always be reporting errors manually. What happens if there's an error we didn't anticipate?
  // In that case we can attach some user data to ctx.bugsnag, so we know which user was affected by the error.
  ctx.bugsnag = {
    user: {
      id: 1,
      name: "james",
      plan: "beast-mode",
    },
  };
  await next();
}

module.exports = {
  attemptLogin,
  loadSession,
};