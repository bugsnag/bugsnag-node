module.exports = requestInfo = (req) ->

  connection = req.connection
  address = connection && connection.address()
  portNumber = address && address.port

  port = if (!portNumber || portNumber == 80 || portNumber == 443) then ''   else ':' + portNumber

  full_url = req.protocol + "://" + req.host + port + req.url

  request = {
    url: full_url
    path: req.path || req.url
    method: req.method
    headers: req.headers
    httpVersion: req.httpVersion
  }
  request.params = req.params if req.params && Object.keys(req.params).length > 0
  request.query = req.query if req.query && Object.keys(req.query).length > 0
  request.body = req.body if req.body && Object.keys(req.body).length > 0

  if connection
    request.connection = {
      remoteAddress: connection.remoteAddress
      remotePort: connection.remotePort
      bytesRead: connection.bytesRead
      bytesWritten: connection.bytesWritten
      localPort: address.port
      localAddress: address.address
      IPVersion: address.family
    }

  request
