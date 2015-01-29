var MockReq = require('mock-req');

// Build a valid "req" Express object from a Socket.io message
module.exports = function(msg, socket) {
	var req = new MockReq({
		method: msg.method,
		url: msg.url,
		headers: socket.handshake.headers,

		isSocket: true,
		socket: socket
	});
};