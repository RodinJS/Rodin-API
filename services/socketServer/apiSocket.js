/**
 * Created by xgharibyan on 11/23/16.
 */


const config = require('../../config/env');
const sio = require('socket.io');
const _ = require('lodash');
const jwt = require('jsonwebtoken');


class RodinSocketConstructor {

    constructor(io) {
        this.io = io.of('/');

        this.io.use(function (socket, next) {
            jwt.verify(socket.handshake.query.token, config.jwtSecret, (err, decoded) => {
                if (err)
                    next(new Error('Authentication error'));
                else {
                    socket.decoded = decoded;
                    next();
                }
            });

        });
        this.io.on('connection', this.join)

    }

    join(socket) {
        //join to organization
        socket.join(socket.decoded.username);
        //leave from current room
        socket.leave(socket.id);
    }

    findUser(userName) {
        return _.find(this.io.sockets, function (socket) {
            return socket.decoded.username == userName;
        });
    }

    broadcastToRoom(roomName, eventName, data) {
        this.io.to(roomName).emit(eventName, data);
    }

    emitToUser(socketId, eventName, data) {
        this.io.connected[socketId].emit(eventName, data);
    }

}


const Service = {};

function run(server) {
    let io = sio(server);
    Service.io = new RodinSocketConstructor(io);
}

module.exports = {run, Service};
