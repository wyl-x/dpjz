const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server, {
    cors: {
        origin: "*"
    }
});
const db = require('./db');

// app.use('/', function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     next();
// });

app.use(express.static('public'))

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    broadcast('room')
    broadcast('user')
    broadcast('record')

    socket.on('join', (roomId, user) => {
        // 若用户名已存在,更新客户端userId
        const users = db.findAll('user')
        const exists = users.find(item => item.name === user.name)
        if (exists && exists.id !== user.id) {
            socket.emit('update-user-id', exists)
            return
        }

        socket.join(roomId)
        db.update('user', user.id, {...user, roomId})
        broadcast('user')
        broadcast('record')
    });

    socket.on('leave', (roomName) => {
        socket.leave(roomName)
        broadcast('room')
    });

    socket.on('add-room', (data) => {
        db.create('room', data)
        broadcast('room')
    });

    socket.on('del-room', (id) => {
        db.delete('room', id)
        broadcast('room')
    });

    socket.on('rooms', () => {
        broadcast('room')
    });

    socket.on("disconnect", (reason) => {
        console.log(`${socket.id} disconnect`, reason);
    });

    socket.on('add-record', (data) => {
        db.create('record', data)
        broadcast('record')
        socket.to(data.roomId).emit('speak', data)
    });

});

function broadcast(name) {
    io.emit(name + 's', db.findAll(name))
}

server.listen(3000, () => {
    console.log('listening on *:3000');
});