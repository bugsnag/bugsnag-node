const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const bugsnag = require("./bugsnag");
const { attemptLogin, loadSession } = require("./api");

const app = new Koa();
const router = new Router();

app.use(bodyParser());

// We need to register the bugsnag koa handler, which catches any errors emitted from koa and
// sends them to Bugsnag, along with the request information the error occurred in.
app.on("error", bugsnag.koaHandler);

// In your application, it's likely you have some form of session system. For this example, we're
// just adding some fake user information to any unhandled errors, so we can track what kind of
// impact our *bad* code is having on our user base.
router.use(loadSession);

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
router.post('/login', async (ctx, next) => {
  const { username, password } = ctx.request.body;

  // If the underlying Promise/async function throws an error, it is automatically caught by koa's
  // error handler, no need to wrap the function in a `try` `catch` unless you really need to.
  const user = await attemptLogin(username, password);

  if (user) {
    ctx.body = "Logged in!";
  } else {
    ctx.throw("Invalid username or password.", 400);

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
});

// Add the koa-router routes middleware.
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT || 3000);