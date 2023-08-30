const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

let timer

app.use(express.static('public'))


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    startBroadcastRooms()
    socket.on('join', (roomName) => {
        socket.join(roomName)
    });


    socket.on('rooms', (roomName) => {
        socket.emit('rooms', [...socket.rooms])
    });

    socket.on("disconnect", (reason) => {
        // ...
        console.log(`${socket.id} disconnect`, reason);
    });
});


function startBroadcastRooms(){
    clearInterval(timer)
    timer = setInterval(() => {
        let roomMap = {}
        for (const socketItem of io.sockets.sockets) {
            const [id, socket] = socketItem
            for (const room of socket.rooms) {
                roomMap[room] = roomMap[room] ? roomMap[room] + 1 : 1
            }
        }
        console.log(roomMap);

        if (Object.keys(roomMap).length === 0) {
            clearInterval(timer)
        }

        io.emit('rooms', roomMap)

    }, 2000)
}

server.listen(3000, () => {
    console.log('listening on *:3000');
});