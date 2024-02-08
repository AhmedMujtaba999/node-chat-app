const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const { getUser, getUserInRoom, removeUser, addUser } = require('./utils/users')
const app = express();
const server = http.createServer(app)
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicFileDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicFileDirectoryPath));


io.on('connection', (socket) => {
    console.log('new websocket connection');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('admin', 'welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('admin', `${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('profanity not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback();
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }

    })

})

server.listen(port, () => {
    console.log(`server is up on port ${port}`);
})