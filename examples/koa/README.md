# Koa Example

This example shows how you can use the Bugsnag Node notifier with Koa apps.

## Demonstrates

- [Configuring the client](bugsnag.js#L4-L9)
- [Registering error handler](index.js#L12-L14)
- [Sending a custom error](index.js#L54-L62)
- Handling errors from promises
  - [Automatically](bugsnag.js#L11-L20)
  - [Manually](index.js#L45-L47)
- Attaching session/user info to errors
  - [Registering your app's middleware](index.js#L16-L19)
  - [Setting the request data](api.js#L20-L31)

## Setup

This example gives you the ability to send request to a single endpoint, which depending on
[the parameters](index.js#L21-41), will throw different kinds of errors.

1. Clone the repository

  ```
  $ git clone https://github.com/bugsnag/bugsnag-node.git
  ```

2. Add your project API key

  Open the `bugsnag.js` file and replace `API-KEY-GOES-HERE` with your own API key.

  ```js
  bugsnag.register("API-KEY-GOES-HERE");
  ```

3. Install dependencies

  You can use `npm install` or `yarn install` to install the dependencies.

4. Start the server

  Again, you can use `npm start` or `yarn start` to start the webserver on port 3000 (by default).