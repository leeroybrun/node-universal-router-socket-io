var MockRes = require('mock-res');

// Build a valid "res" Express object
module.exports = function(msg, socket, callback) {
	var req = new MockReq({
		method: msg.method,
		url: msg.url,
		headers: socket.handshake.headers,

		isSocket: true,
		socket: socket
	});
};