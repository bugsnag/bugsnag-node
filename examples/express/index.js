const express = require("express");
const bodyParser = require("body-parser");
const bugsnag = require("./bugsnag");
const { attemptLogin, loadSession } = require("./api");

const app = express();

app.use(bodyParser.json());
app.use(bugsnag.requestHandler);
app.use(loadSession());

app.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  attemptLogin(username, password)
    .then(user => {
      if (user) {
        res.send('Logged in!');
      } else {
        res.status(400).send('Invalid username or password.');

        bugsnag.notify(new Error("Failed login attempt"), {
          // Maybe you have a system in place to block a particular IP address, or account if there are
          // too many failed attempts within a specified time period? Why not send this event to Bugsnag?
          attempt: {
            username,
            ip: '192.168.1.16',
            tries: 4,
          },
        });
      }
    })
    .catch(next);
});

app.use(bugsnag.errorHandler);

app.listen(3000);