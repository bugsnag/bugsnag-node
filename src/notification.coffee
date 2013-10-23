Utils = require "./utils"
Logger = require "./logger"
Configuration = require "./configuration"
requestInfo = require "./request_info"
path = require "path"

module.exports = class Notification
  # Notifier Constants
  NOTIFIER_NAME = "Bugsnag Node Notifier"
  NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'))
  NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node"

  constructor: (bugsnagError, options = {}) ->
    event = 
      exceptions: [bugsnagError]

    event.userId = options.userId || process?.domain?._bugsnagOptions?.userId if options.userId || process?.domain?._bugsnagOptions?.userId
    event.context = options.context || process?.domain?._bugsnagOptions?.context if options.context || process?.domain?._bugsnagOptions?.context
    event.groupingHash = options.groupingHash || process?.domain?._bugsnagOptions?.groupingHash if options.groupingHash || process?.domain?._bugsnagOptions?.groupingHash

    event.appVersion = Configuration.appVersion if Configuration.appVersion
    event.releaseStage = Configuration.releaseStage if Configuration.releaseStage

    delete options.userId
    delete options.context
    delete options.groupingHash
    event.metaData = Utils.cloneObject Configuration.metaData if Configuration.metaData && Object.keys(Configuration.metaData).length > 0

    if options.req
      @processRequest event, requestInfo(options.req)
      delete options.req
    else if process?.domain?._bugsnagOptions?.cleanedRequest
      @processRequest event, process.domain._bugsnagOptions.cleanedRequest


    if process?.domain?._bugsnagOptions
      domainOptions = Utils.cloneObject(process.domain._bugsnagOptions, except: ["req", "context", "userId", "groupingHash"])
      Utils.mergeObjects event.metaData ||= {}, domainOptions if Object.keys(domainOptions).length > 0
    
    Utils.mergeObjects event.metaData ||= {}, options if Object.keys(options).length > 0

    @apiKey = Configuration.apiKey
    @notifier = 
      name: NOTIFIER_NAME
      version: NOTIFIER_VERSION
      url: NOTIFIER_URL

    @events = [event]

  deliver: (cb) ->
    cb = null unless Utils.typeOf(cb) == "function"
    
    # Filter before sending
    Utils.filterObject(@events[0].metaData, Configuration.filters)

    port = Configuration.notifyPort || (if Configuration.useSSL then 443 else 80)
    Configuration.logger.info "Delivering exception to #{if Configuration.useSSL then "https" else "http"}://#{Configuration.notifyHost}:#{port}#{Configuration.notifyPath}"

    # We stringify, ignoring any circular structures
    cache = []
    payload = JSON.stringify @, (key, value) ->
      if Utils.typeOf(value) == "object"
        return if cache.indexOf(value) != -1
        cache.push(value)
      return value

    options =
      host: Configuration.notifyHost
      port: port
      path: Configuration.notifyPath
      method: 'POST'
      headers:
        "Content-Type": 'application/json'
        "Content-Length": payload.length

    Configuration.logger.info payload

    lib = if Configuration.useSSL then require("https") else require("http")
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
        Configuration.logger.error err
    req.write payload, "utf-8"
    req.end()

  processRequest: (event, cleanRequest) ->
    event.metaData ||= {}

    event.metaData.request = cleanRequest

    event.context ||= cleanRequest.path || cleanRequest.url
    event.userId ||= cleanRequest?.headers?["x-forwarded-for"] || cleanRequest?.connection?.remoteAddress
