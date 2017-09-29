(function() {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SocketServer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socketIoMin = require('https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.4/socket.io.min.js');

var _socketIoMin2 = _interopRequireDefault(_socketIoMin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function toQueryString(paramsObject) {
    return Object.keys(paramsObject).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(paramsObject[key]);
    }).join('&');
}

function addScript(src, callback) {
    var s = document.createElement('script');
    s.setAttribute('src', src);
    s.onload = callback;
    document.body.appendChild(s);
}

var SocketServer = exports.SocketServer = function () {
    function SocketServer() {
        _classCallCheck(this, SocketServer);

        this.host = '{subscriptionURL}/api';
        this.socketHost = '{socketURL}';
        this.emitBuffer = {};
        this.listenerBuffer = {};
        this.disconnected = this.disconnected.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.broadcastToAll = this.broadcastToAll.bind(this);
        this.subscribeToEvents = this.subscribeToEvents.bind(this);
        this.getConnectedUsersList = this.getConnectedUsersList.bind(this);
        this.sendMessageToUser = this.sendMessageToUser.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
        this.getRooms = this.getRooms.bind(this);
        this.deleteRoom = this.deleteRoom.bind(this);
        this.broadcastToRoom = this.broadcastToRoom.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.connect = this.connect.bind(this);
        this.reconnect = this.reconnect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.onConnected = this.onConnected.bind(this);
        this.setData = this.setData.bind(this);
        this.mySocketId = this.mySocketId.bind(this);
        this.isMe = this.isMe.bind(this);
        this.validateSocketConnection = this.validateSocketConnection.bind(this);
    }

    _createClass(SocketServer, [{
        key: 'connect',
        value: function connect(data) {
            var _this = this;

            data = toQueryString(data);

            this.subscribe().then(function (response) {
                //console.log('response', response.data);
                _this.ns = response.data.ns;
                //console.log('NS SETTINGS', [this.ns, params, this.host]);
                //console.log('io', io);
                _this.Socket = (0, _socketIoMin2.default)(_this.socketHost + '/' + _this.ns, {
                    query: data,
                    resource: "socket.io"
                    //transports: ['websocket', 'polling']
                });
                return _this.subscribeToEvents();
            }).catch(function (error) {
                console.log(error);
                _this.emitBuffer = {};
                _this.listenerBuffer = {};
            });
        }
    }, {
        key: 'disconnect',
        value: function disconnect() {
            this.Socket.disconnect();
        }
    }, {
        key: 'mySocketId',
        value: function mySocketId() {
            return this.Socket.id;
        }
    }, {
        key: 'isMe',
        value: function isMe(data) {
            if (data.socketId == this.Socket.id) return true;
            return false;
        }
    }, {
        key: 'subscribeToEvents',
        value: function subscribeToEvents() {
            var _this2 = this;

            this.Socket.on('connect', function (socket) {
                return _this2.connected(socket);
            });
            this.Socket.on('subscribeToApp', this.subscribe);
            this.Socket.on('disconnect', this.disconnected);
            //this.Socket.on('message', RodinSocket.onMessage);
            this.Socket.on('onError', this.onError);
        }
    }, {
        key: 'reconnect',
        value: function reconnect() {
            this.Socket.connect();
        }
    }, {
        key: 'connected',
        value: function connected(socket) {
            if (Object.keys(this.listenerBuffer).length > 0) {
                for (var key in this.listenerBuffer) {
                    if (key == 'connection') {
                        this.listenerBuffer[key](this.Socket.connected);
                    } else {
                        this.Socket.on(key, this.listenerBuffer[key]);
                    }
                }
                this.listenerBuffer = {};
            }
            if (Object.keys(this.emitBuffer).length > 0) {
                for (var _key in this.emitBuffer) {
                    this.Socket.emit(_key, this.emitBuffer[_key]);
                }
                this.emitBuffer = {};
            }
            console.log('connected', socket);
        }
    }, {
        key: 'onConnected',
        value: function onConnected(cb) {
            if (!this.Socket) {
                return this.listenerBuffer['connection'] = cb;
            }
            cb(this.Socket.connected);
        }
    }, {
        key: 'disconnected',
        value: function disconnected(err) {
            console.warn('disconnected', err);
        }
    }, {
        key: 'onMessage',
        value: function onMessage(eventName, cb) {
            if (!this.Socket) {
                return this.listenerBuffer[eventName] = cb;
            }
            this.Socket.on(eventName, cb);
        }
    }, {
        key: 'onError',
        value: function onError(data) {
            console.error('Socket Request error', data);
        }
    }, {
        key: 'broadcastToAll',
        value: function broadcastToAll(name, param) {
            var data = { event: name, data: param };
            if (this.validateSocketConnection('broadcastToAll', data)) {
                this.Socket.emit('broadcastToAll', data);
            }
        }
    }, {
        key: 'broadcastToRoom',
        value: function broadcastToRoom(eventName, params, roomName) {
            var data = { roomName: roomName, eventName: eventName || false, data: params };
            if (this.validateSocketConnection('broadcastToRoom', data)) {
                this.Socket.emit('broadcastToRoom', data);
            }
        }
    }, {
        key: 'sendMessageToUser',
        value: function sendMessageToUser(socketId, message) {
            var data = { event: 'sendMessageToUser', socketIds: socketId, message: message };
            if (this.validateSocketConnection('message', data)) {
                this.Socket.emit('message', data);
            }
        }
    }, {
        key: 'setData',
        value: function setData(data) {
            if (this.validateSocketConnection('setData', data)) {
                this.Socket.emit('setData', data);
            }
        }
    }, {
        key: 'getConnectedUsersList',
        value: function getConnectedUsersList() {
            if (this.validateSocketConnection('getConnectedUsersList', {})) {
                this.Socket.emit('getConnectedUsersList', {});
            }
        }
    }, {
        key: 'joinRoom',
        value: function joinRoom(roomName, notifyAll) {
            var data = { roomName: roomName, notifyAll: notifyAll };
            if (this.validateSocketConnection('joinRoom', data)) {
                this.Socket.emit('joinRoom', data);
            }
        }
    }, {
        key: 'leaveRoom',
        value: function leaveRoom(roomName, notifyAll) {
            var data = { roomName: roomName, notifyAll: notifyAll };
            if (this.validateSocketConnection('leaveRoom', data)) {
                this.Socket.emit('leaveRoom', data);
            }
        }
    }, {
        key: 'getRooms',
        value: function getRooms() {
            if (this.validateSocketConnection('getRooms', {})) {
                this.Socket.emit('getRooms', {});
            }
        }
    }, {
        key: 'deleteRoom',
        value: function deleteRoom(roomName) {
            var data = { roomName: roomName };
            if (this.validateSocketConnection('deleteRoom', data)) {
                this.Socket.emit('deleteRoom', data);
            }
        }
    }, {
        key: 'validateSocketConnection',
        value: function validateSocketConnection(eventName, data) {
            if (!this.Socket) {
                this.emitBuffer[eventName] = data;
                return false;
            }
            return true;
        }
    }, {
        key: 'subscribe',
        value: function subscribe() {
            var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { projectId: 'gago' };

            var url = this.host + '/socket-server/subscribe';
            var method = 'POST';
            return new Promise(function (resolve, reject) {
                var req = new XMLHttpRequest();
                req.open(method, url);
                req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                req.onload = function () {
                    return req.status === 200 ? resolve(JSON.parse(req.response)) : reject(Error(req.statusText));
                };
                req.onerror = function (e) {
                    return reject(Error('Network Error: ' + e));
                };
                req.send(JSON.stringify(params));
            });
        }
    }]);

    return SocketServer;
}();
}.bind(this)());
