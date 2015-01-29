var SocketIO = require('socket.io');
var async = require('async');

var buildReq = require('./buildReq');
var buildRes = require('./buildRes');

// Create a new Express server
var SocketServer = function(http) {
    this.http = http;

    this.io  = null;
    this.events = {
        get: {},
        post: {},
        put: {},
        delete: {},
        patch: {},
        options: {},
        head: {}
    };
};

SocketServer.prototype.initialize = function(callback) {
    this.io = SocketIO(this.http.server);

    return callback();
};

SocketServer.prototype.authMiddleware = function(socket, next) {
    var server = this;

    var handshakeData = socket.request;

    if(!handshakeData.headers.cookie) {
        return next(new Error('No cookie transmitted.'));
    }

    server.http.cookieParser(handshakeData, {}, function(parseErr) {
        if(parseErr) { return next(new Error('Error parsing cookies.')); }

        var sid = (handshakeData.secureCookies && handshakeData.secureCookies[config.sidKey]) ||
                        (handshakeData.signedCookies && handshakeData.signedCookies[config.sidKey]) ||
                        (handshakeData.cookies && handshakeData.cookies[config.sidKey]);

        server.http.sessionStore.load(sid, function(err, session) {
            if (err || !session || !User.isLogged(session)) {
                return next(new Error('Error'));
            } else {
                handshakeData.sessionId = sid;
                return next();
            }
        });
    });
};

SocketServer.prototype.registerMiddlewares = function(callback) {
    this.io.use(this.authMiddleware);

    return callback();
};

SocketServer.prototype.registerEvent = function(method, socket) {
    socket.on(method, function(msg, callback) {
        /* msg input format :
            {
                url: '...',
                data: {...}
            }
        */

        msg.method = method;

        var req = buildReq(msg, socket);
        var res = buildRes(msg, socket, callback);
    });
};

SocketServer.prototype.registerEvents = function(callback) {
    var server = this;

    // When routes are added to router, add them to the Socket.io server events list
    events.on('router:add', function(route) {
        server.addEvent(route.method, route.path, route.target);
    });

    // When a client connect, add events
    io.on('connection', function (socket) {
        for(var eventMethod in server.events) {
            server.registerEvent(eventMethod, socket);
        }
    });

    return callback();
};

// Add route (event) to Socket.io
SocketServer.prototype.addEvent = function(route) {
    this.events[route.method][route.path] = route.target;
};

SocketServer.prototype.start = function(callback) {
    var server = this;

    async.waterfall([
        server.initialize,
        server.registerMiddlewares,
        server.registerEvents
    ], function(err) {
        if(err) {
            return callback(err);
        }

        return callback();
    });
};