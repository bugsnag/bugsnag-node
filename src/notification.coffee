Utils = require "./utils"
Logger = require "./logger"
Configuration = require "./configuration"
requestInfo = require "./request_info"
path = require "path"
continuationLocalStorage = require "continuation-local-storage"

module.exports = class Notification
  # Notifier Constants
  NOTIFIER_NAME = "Bugsnag Node Notifier"
  NOTIFIER_VERSION = Utils.getPackageVersion(path.join(__dirname, '..', 'package.json'))
  NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-node"

  SUPPORTED_SEVERITIES = ["error", "warning", "info"]

  constructor: (bugsnagError, options = {}) ->
    event =
      exceptions: [bugsnagError]

    nsOptions = continuationLocalStorage?.getNamespace("bugsnag")?.get("options")
    options = Utils.mergeObjects(Utils.cloneObject(nsOptions), options) if nsOptions

    event.userId = options.userId if options.userId
    event.context = options.context if options.context
    event.groupingHash = options.groupingHash if options.groupingHash

    event.appVersion = Configuration.appVersion if Configuration.appVersion
    event.releaseStage = Configuration.releaseStage if Configuration.releaseStage

    event.payloadVersion = Configuration.payloadVersion if Configuration.payloadVersion

    if options.severity? and options.severity in SUPPORTED_SEVERITIES
      event.severity = options.severity
    else
      event.severity = "warning"

    event.metaData = Utils.cloneObject Configuration.metaData if Configuration.metaData && Object.keys(Configuration.metaData).length > 0
    event.device = {hostname: Configuration.hostname} if Configuration.hostname

    @processRequest event, requestInfo(options.req) if options.req

    metaData = Utils.cloneObject(options, except: ["req", "context", "userId", "groupingHash"])
    Utils.mergeObjects event.metaData ||= {}, metaData if Object.keys(metaData).length > 0

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
