var requestInfo;

module.exports = requestInfo = function(req) {
  var address, connection, full_url, port, portNumber, request;
  connection = req.connection;
  address = connection && connection.address();
  portNumber = address && address.port;
  port = !portNumber || portNumber === 80 || portNumber === 443 ? '' : ':' + portNumber;
  full_url = req.protocol + "://" + req.host + port + req.url;
  request = {
    url: full_url,
    path: req.path || req.url,
    method: req.method,
    headers: req.headers,
    httpVersion: req.httpVersion
  };
  if (req.params && typeof req.params === 'object' && Object.keys(req.params).length > 0) {
    request.params = req.params;
  }
  if (req.query && typeof req.params === 'object' && Object.keys(req.query).length > 0) {
    request.query = req.query;
  }
  if (req.body && typeof req.params === 'object' && Object.keys(req.body).length > 0) {
    request.body = req.body;
  }
  if (connection) {
    request.connection = {
      remoteAddress: connection.remoteAddress || req.ip,
      remotePort: connection.remotePort,
      bytesRead: connection.bytesRead,
      bytesWritten: connection.bytesWritten,
      localPort: portNumber,
      localAddress: address != null ? address.address : void 0,
      IPVersion: address != null ? address.family : void 0
    };
  }
  return request;
};
