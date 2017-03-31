# Express Example

This example shows how you can use the Bugsnag Node notifier with Express apps.

## Demonstrates

- [Configuring the client](bugsnag.js#L4-L9)
- Registering middleware
  - [Request handler](index.js#L10-L12)
  - [Error handler](index.js#L66-L69)
- [Sending a custom error](index.js#L49-L57)
- Handling errors from promises
  - [Automatically](bugsnag.js#L11-L20)
  - [Manually](index.js#L60-L63)
- Attaching session/user info to errors
  - [Registering your app's middleware](index.js#L14-L17)
  - [Setting the request data](api.js#L22-L31)

## Setup

This example gives you the ability to send request to a single endpoint, which depending on
[the parameters](index.js#L19-39), will throw different kinds of errors.

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
