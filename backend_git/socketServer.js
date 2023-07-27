const registerSocketServer = (server) => {
    const io = require('socket.io')(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        }
    });

    io.on('connection', (socket) => {
        console.log('user connected');
        console.log(socket.id);

        /**
         * Handle message from a client
         * If toId is provided message will be sent ONLY to the client with that id
         * If toId is NOT provided and room IS provided message will be broadcast to that room
         * If NONE is provided message will be sent to all clients
         */
        socket.on('message', (message, toId = null, room = null) => {
            log('Client ' + socket.id + ' said: ', message);

            if (toId) {
                console.log('From ', socket.id, ' to ', toId, message.type);

                io.to(toId).emit('message', message, socket.id);
            } else if (room) {
                console.log('From ', socket.id, ' to room: ', room, message.type);

                socket.broadcast.to(room).emit('message', message, socket.id);
            } else {
                console.log('From ', socket.id, ' to everyone ', message.type);

                socket.broadcast.emit('message', message, socket.id);
            }
        });

        let roomAdmin; // save admins socket id (will get overwritten if new room gets created)

        

    })
}

module.exports = {
    registerSocketServer,
}