const path = require('path');
const express = require('express');
const app = express();
const socketIO = require('socket.io');
//import { Server } from "socket.io"
//import * as http from "http"
//import { ChangeSet, Text } from "@codemirror/state"
const {ChangeSet, Text} = require("@codemirror/state")
require('dotenv').config();

const port = process.env.PORT || 8080;
const env = process.env.NODE_ENV || 'development';

// Redirect to https
app.get('*', (req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && env !== 'development') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    next();
});

app.use(express.static(path.join(__dirname, 'build')));


app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const server = require('http').createServer(app);
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});

const origin = process.env.RUNNING === 'local' ?  '*' : ['https://tech-interview.netlify.app']

/**
 * Socket.io events
 */
const io = socketIO(server, {
  cors: {
  origin: origin,
  methods: [ "GET", "POST" ]
}
});

let roomCollab = {}

io.on('connection', socket => {
  socket.on("request room", (roomId) => {
    const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
    let numClients = clientsInRoom ? clientsInRoom.size : 0;
    if (numClients >= 2) {
      socket.emit("room full");
    }
    else if (numClients == 0) {
      roomCollab[roomId] = {doc: Text.of(["/*Start working here*/\n"]), pending: [], updates: []}
      socket.join(roomId);
      socket.emit("created", {id: socket.id, roomId: roomId, role: 1});
    }
    else {
      socket.join(roomId);
      const party = [...io.sockets.adapter.rooms.get(roomId)];
      const partner = party.filter((id) => {return id!==socket.id});
      socket.emit("joined", {id: socket.id, roomId: roomId, party: party, partner: partner, role: 2});
    }
  })

  socket.on("request editor", (roomId) => {
    socket.emit("code ready")
  })

  socket.on("made a call", (data) => {
    io.to(data.receiverId).emit('received a call', {callerId: data.fromId, callerSig: data.callerSig});
  })

  socket.on("answered a call", (data) => {
    io.to(data.callerId).emit('call answered', {receiverId: socket.id, receiverSig: data.receiverSig});
  })

  socket.on('request code', (room) => {
    const [firstId] = io.sockets.adapter.rooms.get(room);
    io.to(firstId).emit('need code', socket.id);
  })

  socket.on('request replay', (room)=>{
    const [firstId] = io.sockets.adapter.rooms.get(room);
    io.to(firstId).emit('ready for replay', socket.id);
    //io.to(data.receiverId).emit('ready for replay', {requesterId: data.fromId, requesterSig: data.requesterSig});
  })

  socket.on('sending replay', (data) => {  
    io.to(data.requesterId).emit('receiving replay', {recorderSig: data.recorderSig})
  })

  socket.on('give code', (data) => {
    //console.log(data.code);
    //console.log(data.receiver)
    io.to(data.receiver).emit('incoming code', data);
  })

  socket.on("disconnecting", () => {
    socket.rooms.forEach(user => {
      if (user !== socket.id){
        io.to(user).emit("stream end", socket.id);
      }
    });
  });

  socket.on("joinRoom", (roomId) => {
    const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
    let numClients = clientsInRoom ? clientsInRoom.size : 0;
    if (numClients > 2) {
      socket.emit("roomFull");
    }
    else {
      socket.emit("roomAvailable", roomId);
    }
  })

  socket.on("hit replay", (blob) => {
    socket.rooms.forEach(user => {
      if (user !== socket.id){
        io.to(user).emit("replay received", blob);
      }
    });
  })

  socket.on("end replay", () => {
    socket.rooms.forEach(user => {
      if (user !== socket.id){
        io.to(user).emit("replay ended");
      }
    });
  })


  socket.on("pullUpdates", (version, roomId) => {
    //console.log(roomCollab)
    if (version < roomCollab[roomId]['updates'].length) {
      socket.emit("pullUpdateResponse", JSON.stringify(roomCollab[roomId]['updates'].slice(version)))
    } else {
      roomCollab[roomId]['pending'].push(updates => {
        socket.emit(
          "pullUpdateResponse",
          JSON.stringify(updates.slice(version))
        )
      })
    }
  })

  socket.on("pushUpdates", (version, docUpdates, roomId) => {
    docUpdates = JSON.parse(docUpdates)

    try {
      if (version != roomCollab[roomId]['updates'].length) {
        socket.emit("pushUpdateResponse", false)
      } else {
      for (let update of docUpdates) {
        let changes = ChangeSet.fromJSON(update.changes)
        //console.log("request from socket id: "+socket.id)
        //console.log("Changes: " + changes)
        roomCollab[roomId]['updates'].push({ changes, clientID: update.clientID, effects: update.effects, caret: update.caret })
        //console.log("Before" + roomCollab[roomId]['doc'] )
        roomCollab[roomId]['doc'] = changes.apply(roomCollab[roomId]['doc'])
        //console.log("After" + roomCollab[roomId]['doc'] )

      }
      socket.emit("pushUpdateResponse", true)

      while (roomCollab[roomId]['pending'].length) roomCollab[roomId]['pending'].pop()(roomCollab[roomId]['updates'])
      }
    } catch (error) {
      console.error(error)
    }
  })

  socket.on("getDocument", (roomId) => {
    socket.emit("getDocumentResponse", roomCollab[roomId]['updates'].length, roomCollab[roomId]['doc'].toString())
    
  })
});