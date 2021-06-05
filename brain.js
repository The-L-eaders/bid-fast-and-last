'use strict';

const cors = require('cors')
const PORT = process.env.PORT || 3000

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");

server.listen(PORT, () => console.log("listening " + PORT));


//// Set the view engine for server-side templating
app.set('view engine','ejs');

app.use(express.static('./public'));

app.use(cors());




let io = require("socket.io")(server);


// -----------------------------------------------------------


let latest = {};

io.on('connection', (socket) => {

    socket.on('startBidding', (obj) => {
        latest = obj;
        setInterval(() => {
            if (obj.counter == 0) {
                return obj.counter = 0, obj.totalFromUser = 0;
            };
            obj.counter = obj.counter - 1;
            io.emit('liveCounter', obj.counter);

        }, 1000);
        console.log(obj.totalFromUser, '*-----*', obj.text)

    });

    let users = ''
    socket.on('newUser', data => {
        users = data
        socket.broadcast.emit('greeting', data);
    });




    socket.on('increasePrice', (total) => {

        io.emit('showLatest', { total: total, name: users });
    });

    io.emit('liveBid', latest.totalFromUser);




});