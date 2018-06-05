const express = require("express");
const bodyParser = require("body-parser");
const bugsnag = require("./bugsnag");
const { attemptLogin, loadSession } = require("./api");

const app = express();

// We need to add the Bugsnag request handler middleware, so when an async error occurs we're
// able to notify any middleware in the chain (in this case the Bugsnag error handler).
app.use(bugsnag.requestHandler);

// Parse the request body into JSON
app.use(bodyParser.json());

// In your application, it's likely you have some form of session system. For this example, we're
// just adding some fake user information to any unhandled errors, so we can track what kind of
// impact our *bad* code is having on our user base.
app.use(loadSession);

// Our sample login endpoint for this example app. You can try this endpoint out for yourself.
//
// Failed login attempt
//
// ```
//   curl \
//     -X POST \
//     -H "Content-Type: application/json" \
//     -d '{"username":"admin","password":"xyz"}'
//     http://localhost:3000/login`
// ```
//
// Unable to connect to database
//
// ```
//   curl \
//     -X POST \
//     -H "Content-Type: application/json" \
//     -d '{"username":"crash","password":"xyz"}' \
//     http://localhost:3000/login
// ```
app.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  attemptLogin(username, password)
    .then(user => {
      if (user) {
        res.send("Logged in!");
      } else {
        res.status(400).send("Invalid username or password.");

        bugsnag.notify(new Error("Failed login attempt"), {
          // Maybe you have a system in place to block a particular IP address, or account if there are
          // too many failed attempts within a specified time period? Why not send this event to Bugsnag?
          attempt: {
            username,
            ip: "192.168.100.16",
            tries: 4,
          },
        });
      }
    })
    // To allow errors to be passed to the appropriate error handler middleware, we can simply pass the
    // next callback to the `catch` part of our Promise chain. Basically all this means is that unhandled
    // errors in your Promises are not lost.
    .catch(next);
});

// We also need to add the bugsnag error handler middleware, which catches any unhandled errors
// within your routes (like the one above) and sends them to Bugsnag, along with the request information
// the error occurred in, to make debugging errors *that* much easier.
app.use(bugsnag.errorHandler);

app.listen(process.env.PORT || 3000);