
var wait = false;
function personPlay() {
    socket = io.connect('http://172.17.169.213:8001');
    
    socket.on('wait',function() {
        textContainer.innerText = '等待玩家加入';
        document.getElementById('load').style.display = 'block';
        document.getElementById('load').style.left = (document.body.clientWidth / 2 - 100) + 'px'

        me = false;
        wait = true;

    });

    socket.on('first',function() {
        document.getElementById('load').style.display = 'none';
        textContainer.innerText = '请走棋';
        Big = true;
        me = true;
        wait = false;
        InitChess(Big);

    })

    socket.on('second',function() {
        textContainer.innerText = '等待对方走棋';
        me = false;
        Big = false;
        InitChess(Big);

    })

    socket.on('go',function(i,j,preX,preY) {
        chessBoard[i][j] = 2;
        chessBoard[preX][preY] = 0;

        isXiaQi = true;
        AgainDraw();
        me = true;
        textContainer.innerText = '请走棋';
    })

    socket.on('fail',function() {
        showDialog('惜败！再开一局？', function () {
            socket.disconnect();
            reset();
            personPlay();
          });
          over = true;
    })

    socket.on('leave',function() {
        over = true;
        showDialog('对手已经离开，请重新匹配',function() {
            reset();
            personPlay();
        })
    })
}
// 走棋方法
function personGo(i,j,preX,preY,isFail) {
    socket.emit('go',i,j,preX,preY,isFail);
    textContainer.innerText = '等待对方走棋';
}