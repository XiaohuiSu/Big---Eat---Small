var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var number = 0;
// 存放socket数组
var socketMap = {};

server.listen(8001);

app.use(express.static('public'));

io.on('connection',function(socket) {
    number++;
    socket.clientNum = number;
    socketMap[number] = socket;

    if(number % 2 === 1) {
        // 这里的first对应的回调只有先进入到房间的玩家才能接受到
        socket.emit('wait');
    } else {
        if(socketMap[number - 1]) {
            socketMap[number - 1].emit('first');
            // 这里的second只能由第二个玩家接收，第一个玩家接收不到
            socket.emit('second');
        }
    }

    socket.on('go',function(i,j,preX,preY,isFail) {
     
            console.log(socket.clientNum);
            socketMap[getMatch(socket.clientNum)].emit('go',i,j,preX,preY);
            if(isFail) {
                socketMap[getMatch(socket.clientNum)].emit('fail');
            }
    })

    socket.on('disconnect',function() {
     /*    delete(socketMap[socket.clientNum]); */
        delete(socketMap[socket.clientNum]);
        
        if(socketMap[getMatch(socket.clientNum)]) {
            socketMap[getMatch(socket.clientNum)].emit('leave');
            delete(socketMap[getMatch(socket.clientNum)]);
        }
    })

})

function getMatch(i) {
    if(i % 2 === 1) {
        return i + 1;
    } else {
        return i - 1;
    }
}