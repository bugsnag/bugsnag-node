Bugsnag = require "./bugsnag"
Utils = require "./utils"
Logger = require "./logger"
path = require "path"

module.exports = class Notification
  # Notifier Constants
  NOTIFIER_NAME = "Bugsnag Node Notifier"
  NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'))
  NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node"

  constructor: (bugsnagError, options = {}) ->
    event = 
      exceptions: [bugsnagError]

    event.userId = options.userId if options.userId
    event.appVersion = Bugsnag.appVersion if Bugsnag.appVersion
    event.releaseStage = Bugsnag.releaseStage if Bugsnag.releaseStage
    event.context = options.context if options.context
    event.osVersion = Bugsnag.osVersion if Bugsnag.osVersion

    delete options.userId
    delete options.context
    event.metaData = Utils.cloneObject Bugsnag.metaData if Bugsnag.metaData && Object.keys(Bugsnag.metaData).length > 0

    if options.req
      @processRequest event, options.req
      delete options.req

    Utils.mergeObjects event.metaData ||= {}, options if Object.keys(options).length > 0

    @apiKey = Bugsnag.apiKey
    @notifier = 
      name: NOTIFIER_NAME
      version: NOTIFIER_VERSION
      url: NOTIFIER_URL

    @events = [event]

  deliver: (cb) ->
    cb = null unless Utils.typeOf(cb) == "function"
    
    # Filter before sending
    Utils.filterObject(@events[0].metaData, Bugsnag.filters)

    port = Bugsnag.notifyPort || (if Bugsnag.useSSL then 443 else 80)
    Bugsnag.logger.info "Delivering exception to #{if Bugsnag.useSSL then "https" else "http"}://#{Bugsnag.notifyHost}:#{port}#{Bugsnag.notifyPath}"

    payload = JSON.stringify @
    options =
      host: Bugsnag.notifyHost
      port: port
      path: Bugsnag.notifyPath
      method: 'POST'
      headers:
        "Content-Type": 'application/json'
        "Content-Length": payload.length

    Bugsnag.logger.info payload

    lib = if Bugsnag.useSSL then require("https") else require("http")
    req = lib.request options, (res) ->
      if cb
         bodyRes = ""

         res.setEncoding 'utf8'
        res
        .on('data', (chunk) -> bodyRes += chunk if chunk)
        .on 'end', () ->
          if res.statusCode == 200
            return cb null, bodyRes
          else
            return cb new Error(bodyRes)

    req.on "error", (err) ->
      if cb
        cb err 
      else
        Bugsnag.logger.error err
    req.write payload, "utf-8"
    req.end()

  processRequest: (event, req) ->
    event.metaData ||= {}
    event.metaData.request =
      url: req.url
      method: req.method
      headers: req.headers
      httpVersion: req.httpVersion
      connection:
        remoteAddress: req.connection?.remoteAddress
        remotePort: req.connection?.remotePort
        bytesRead: req.connection?.bytesRead
        bytesWritten: req.connection?.bytesWritten
        localPort: req.connection?.address()?.port
        localAddress: req.connection?.address()?.address
        IPVersion: req.connection?.address()?.family

     event.context ||= req.url
     event.userId ||= req?.headers?["x-forwarded-for"] || req.connection?.remoteAddress