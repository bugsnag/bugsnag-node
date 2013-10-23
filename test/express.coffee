express = require 'express'
sinon = require 'sinon'
assert = require 'assert'
bugsnag = require "../"
http = require 'http'
Notification = require "../lib/notification"

bugsnag.register '00112233445566778899aabbccddeeff'

describe "express middleware", ->

  deliverStub = null
  beforeEach -> deliverStub = sinon.stub(Notification.prototype, "deliver")
  afterEach -> Notification.prototype.deliver.restore()

  it "should automatically collect request data", (next) ->

    app = express()
    app.use app.router

    app.use bugsnag.requestHandler
    app.use bugsnag.errorHandler

    app.get "/ping", (req, res, next) ->
      throw new RangeError()
      res.sned("pong")

    port = app.listen().address().port


    http.request({
      host: 'localhost',
      port: port,
      path: '/ping',
      method: 'GET',
    }, (res) ->
      res.on 'data', ->

      res.on 'end', ->
        console.log 'end'
        assert deliverStub.calledOnce

        request = deliverStub.firstCall.thisValue.events[0].metaData.request

        assert.equal request.url, "http://localhost:#{port}/ping"
        assert.equal request.path, "/ping"
        assert.equal request.method, "GET"
        assert.equal request.headers.host, "localhost:#{port}"
        assert.equal request.httpVersion, "1.1"
        assert.equal request.connection.remoteAddress, "127.0.0.1"
        assert.equal request.connection.localPort, port
        assert.equal request.connection.IPVersion, "IPv4"
        next()
    ).end()

