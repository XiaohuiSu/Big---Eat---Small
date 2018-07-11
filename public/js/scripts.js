var canvasWidth = canvasHeight = Math.min(500, document.documentElement.clientWidth - 20);

var textContainer = document.getElementById('textContainer');
var canvas = document.getElementById('chess');
var context = canvas.getContext('2d');
var person = document.getElementById('person');

canvas.width = canvasWidth;
canvas.height = canvasHeight;

var dialog = document.getElementById('dialog');
var dialogTitle = document.getElementById('dialog-title');
var butOk = document.getElementById('btn_ok');
var butCan = document.getElementById('btn_back');
// 判断己方是大还是小
var Big = false;
// 判断点击的次数
var timeClick = 0;
// 判断是否选中的正确的棋子
var selected = false;
// 存放选中棋子的坐标
var obj = {};
// 棋牌为六横六竖
var MAX = 6;
var boxWidth = (canvasWidth - 10) / MAX;
// 定义棋子的半径
var radius = boxWidth / 2 * 0.8;
var realPadding = 5 + boxWidth / 2;
var socket;
// 判断是否轮到自己走棋
var me = false;
// 判断游戏是否结束
var over = false;
// 棋牌数组
var chessBoard = [];
var dialog = document.getElementById('dialog');
var isXiaQi = false;

// 初始化棋牌
window.onload = function() {
    drawChess();
}

window.onresize = function() {
    document.getElementById('load').style.left = (document.body.clientWidth / 2 - 100) + 'px';

}

canvas.onclick = function(e) {
    // 游戏结束则返回
    if(over) {
        return;
    }
    // 没轮到自己下棋
    if(!me) {
        return;
    }
    var x = e.offsetX,
        y = e.offsetY;

    var i = Math.floor(x / boxWidth);
    var j = Math.floor(y / boxWidth);

    if(i > 5 || j > 5) {
        return;
    }
    if(!selected && chessBoard[i][j] == 1) {
        selected = true;
        obj.x = i;
        obj.y = j;
    }
    // 选中一个己方棋子
    if(selected) {
        textContainer.innerText = "已选中棋子"
  
        // 是否可以落子
        if(isOk(i, j)) {
            isXiaQi = true;
            chessBoard[obj.x][obj.y] = 0;
            chessBoard[i][j] = 1;
            // 根据当前的chessBoard数组重新绘制
            AgainDraw();
            if(isWinner()) {

                showDialog('险胜！再开一局？', function () {
                    // 一定断开socket
                      socket.disconnect();
                      reset();
                      personPlay();
                  });
    
                over = true;
               personGo(i,j,obj.x,obj.y,true);

            } else {
                me = !me;
               personGo(i,j,obj.x,obj.y);
            }
        } 
    }
    // 不能重复点击
}
// 显示对话提示框方法
function showDialog(result,ok) {
    dialogTitle.innerText = result;
    butOk.innerText = '确定';
    butOk.onclick = function() {
        ok();
        dialog.close();
    };
        butCan.innerText = '取消';
        butCan.onclick = function() {
            dialog.close();
        }

    dialog.showModal();
}

// 将棋子绘制出来
function oneStep(i,j) {
    context.beginPath();
    // 创建一个圆形
    context.arc(realPadding + i * boxWidth, realPadding + j * boxWidth, radius, 0, 2 * Math.PI);
    context.closePath();
    var gradient = context.createRadialGradient(realPadding + i * boxWidth + 2, realPadding + j * boxWidth - 2, radius, realPadding + i * boxWidth, realPadding + j * boxWidth, 0);
// 每一个玩家走的都是黑色棋子，对方是白色棋子
    if(me) {
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#636766');
    } else {
        gradient.addColorStop(0, '#9d9d9d');
        gradient.addColorStop(1, '#f9f9f9');
    }

    context.fillStyle = gradient;
    context.fill();
}

// 绘制棋牌
function drawChess() {
    context.strokeStyle = '#5d564e';
    context.lineWidth = 2;
    context.beginPath();
    for (var i = 0; i < MAX; i++) {
      context.moveTo(realPadding + i * boxWidth, realPadding);
      context.lineTo(realPadding + i * boxWidth, canvasHeight - realPadding);
      context.stroke();
      context.moveTo(realPadding, realPadding + i * boxWidth);
      context.lineTo(canvasHeight - realPadding, realPadding + i * boxWidth);
      context.stroke();
    }

// 重置棋牌数组
    for(var i = 0; i < MAX; i++) {
        chessBoard[i] = [];
        for(var j = 0; j < MAX; j++) {
            chessBoard[i][j] = 0;
        }
    }


}

// 联网对战点击事件
person.onclick = function() {
    if(wait) {
        showDialog('是否结束等待？',function() {
            document.getElementById('load').style.display = 'none';
            socket.disconnect();
            reset();
            personPlay();
            wait = false;
            textContainer.innerText = '欢迎游戏';
        })
    } else if(isXiaQi || textContainer.innerText === '等待对方走棋' || textContainer.innerText === '请走棋') {
        showDialog("是否马上离开？",function() {
            over = true;
            me = false;
            socket.disconnect();
            reset();
            personPlay();

        textContainer.innerText = '欢迎游戏'; 
        })
    } else {
        personPlay();
    }
}
// 判断当前玩家是否获胜
// 从当前落子的八个方向判断是否获胜
function isWinner(i,j) {
    var n1, n2;
    // 以下分别是大炮和小炮方判断胜负的方法
    if(Big) { 
        var cnt = 0;
        for(var i = 0; i < MAX; ++i) {
            for(var j = 0; j < MAX; ++j) {
                if(chessBoard[i][j] === 2) {
                    cnt++; 
                }
            }
        }
        if(cnt <= 4) {
            return true;
        }
        return false;
    } else {
        for(var m = 0; m < MAX; ++m) {
            n1 = chessBoard[m].indexOf(2);
            n2 = chessBoard[m].lastIndexOf(2);
            if(n1 !== -1) {
                if(m - 1 >= 0 && chessBoard[m - 1][n1] === 0) {
                    return false;
                }
                if(n1 >= 1 && chessBoard[m][n1 - 1] === 0) {
                    return false;
                }
                if(m < MAX - 1 && chessBoard[m + 1][n1] === 0) {
                    return false;
                }
                if(n1 < MAX - 1 && chessBoard[m][n1 + 1] === 0) {
                    return false;
                }
                

            }

            if(n1 !== n2 && n2 !== -1) {
                if(m - 1 >= 0 && chessBoard[m - 1][n2] === 0) {
                    return false;
                }
                if(n2 >= 1 && chessBoard[m][n2 - 1] === 0) {
                    return false;

                }
                if(m < MAX - 1 && chessBoard[m + 1][n2] === 0) {
                    return false;
                }
                if(n2 < MAX - 1 && chessBoard[m][n2 + 1] === 0) {
                    return false;

                }
            }
        }
        return true;
    
    }
 
}

function reset() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    // 初始化棋牌数组
    // 绘制棋牌
    drawChess();
    isXiaQi = false;
    // 没有结束
    over = false;
    // 轮到自己下棋
    me = true;
  }
  // 初始棋局
function InitChess(fir) {
    me = fir ? false : true;
    for(var i = 0; i < MAX; ++i) {
        for(var j =0; j < 3; ++j) {
            oneStep(i, j);
            chessBoard[i][j] = me ? 1 : 2;
        }
    }
    me = !me;
    oneStep(2, 5);
    oneStep(3, 5);

    chessBoard[2][5] = me ? 1 : 2;
    chessBoard[3][5] = me ? 1 : 2;

    console.log(chessBoard);
}
// 判断是否可以落子
function isOk(i ,j) {

    timeClick++;
    if(timeClick == 2) {
        selected = false;
        timeClick = 0;
    }

    if(chessBoard[i][j] === 1) {
        return false;
    }
    if(Big) {
        if(obj.x === i) {
            if(Math.abs(obj.y - j) === 1 && !chessBoard[i][j]) {
                return true;
            } else if(Math.abs(obj.y - j) === 2 && chessBoard[i][j] === 2) {
                return true;
            }
        }
    
        if(obj.y === j) {
            if(Math.abs(obj.x - i) === 1 && !chessBoard[i][j]) {
                return true;
            } else if(Math.abs(obj.x - i) ===2 && chessBoard[i][j] ===2) {
                return true;
            }
        }
    } else {
        if(obj.x === i) {
            if(Math.abs(obj.y - j) === 1 && !chessBoard[i][j]) {
                return true;
            }
        } 

        if(obj.y === j) {
            if(Math.abs(obj.x - i) === 1 && !chessBoard[i][j]) {
                return true;
            }
        }
    }


    return false;
}
// 重新绘制棋牌
function AgainDraw() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    context.strokeStyle = '#5d564e';
    context.lineWidth = 2;
    context.beginPath();
    for (var i = 0; i < MAX; i++) {
      context.moveTo(realPadding + i * boxWidth, realPadding);
      context.lineTo(realPadding + i * boxWidth, canvasHeight - realPadding);
      context.stroke();
      context.moveTo(realPadding, realPadding + i * boxWidth);
      context.lineTo(canvasHeight - realPadding, realPadding + i * boxWidth);
      context.stroke();
    }

    for(var i = 0; i < MAX; ++i) {
        for(var j = 0; j < MAX; ++j) {
            if(chessBoard[i][j] == 1) {
                me = true;
                oneStep(i, j);
            } else if(chessBoard[i][j] == 2) {
                me = false;
                oneStep(i, j);
            }
            
        }
    }
    me = false;
}


