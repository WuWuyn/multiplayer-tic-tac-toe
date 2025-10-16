// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// --- Trạng thái trò chơi (Game State) ---
let board;
let players = [];
let gameState;
let rematchRequests;

const initializeGame = () => {
    board = Array(25).fill(0); // Bàn cờ bắt đầu với số 0
    gameState = 'WAITING';
    rematchRequests = new Set();
    console.log("Máy chủ đã sẵn sàng, đang chờ người chơi.");
};

initializeGame();

// --- Các hàng thắng ---
const winningLines = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
];

const broadcast = (data) => {
    players.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

const checkGameStatus = () => {
    for (const line of winningLines) {
        const values = line.map(index => board[index]);

        // Kiểm tra người chơi LẺ (ODD) thắng
        if (values.every(v => v > 0 && v % 2 !== 0)) {
            return { winner: 'ODD', winningLine: line };
        }

        // Kiểm tra người chơi CHẴN (EVEN) thắng
        if (values.every(v => v > 0 && v % 2 === 0)) {
            return { winner: 'EVEN', winningLine: line };
        }
    }

    // Game không có hòa, vì luôn có thể click tiếp
    return { winner: null };
};

wss.on('connection', (ws) => {
    console.log('Một client đã kết nối.');

    if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Phòng chơi đã đầy.' }));
        ws.close();
        return;
    }

    players.push(ws);
    // Người chơi 1 là ODD, người chơi 2 là EVEN
    ws.playerRole = (players.length === 1) ? 'ODD' : 'EVEN';
    ws.send(JSON.stringify({ type: 'PLAYER_ASSIGNED', player: ws.playerRole }));
    console.log(`Người chơi ${players.length} (${ws.playerRole}) đã kết nối.`);

    if (players.length < 2) {
        ws.send(JSON.stringify({ type: 'WAITING_FOR_OPPONENT' }));
    } else {
        gameState = 'ACTIVE';
        board = Array(25).fill(0);
        rematchRequests = new Set();
        broadcast({
            type: 'GAME_START',
            board,
        });
        console.log(`Game bắt đầu!`);
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Logic xử lý khi người chơi click vào ô
        if (data.type === 'INCREMENT' && gameState === 'ACTIVE') {
            const squareIndex = data.square;
            if (squareIndex >= 0 && squareIndex < 25) {
                board[squareIndex]++; // Tăng giá trị ô cờ

                // Sau mỗi lần tăng, kiểm tra ngay có ai thắng không
                const { winner, winningLine } = checkGameStatus();

                if (winner) {
                    gameState = 'GAME_OVER';
                    broadcast({ type: 'GAME_OVER', winner, winningLine, board });
                    console.log(`Game kết thúc. Người thắng: ${winner}`);
                } else {
                    // Nếu chưa ai thắng, chỉ cập nhật lại bàn cờ cho mọi người
                    broadcast({ type: 'GAME_UPDATE', board });
                }
            }
        } else if (data.type === 'REQUEST_REMATCH' && gameState === 'GAME_OVER') {
            rematchRequests.add(ws.playerRole);
            broadcast({ type: 'REMATCH_REQUESTED', player: ws.playerRole });

            if (rematchRequests.size === 2) {
                console.log("Cả hai người chơi đồng ý chơi lại. Bắt đầu ván mới.");
                gameState = 'ACTIVE';
                board = Array(25).fill(0);
                rematchRequests = new Set();
                broadcast({ type: 'GAME_START', board });
            }
        }
    });

    ws.on('close', () => {
        console.log(`Client (${ws.playerRole || 'chưa xác định'}) đã ngắt kết nối.`);
        const wasInGame = players.includes(ws);
        players = players.filter(p => p !== ws);

        if (wasInGame && gameState !== 'GAME_OVER') {
            gameState = 'GAME_OVER';
            if (players.length > 0) {
                players[0].send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
            }
            console.log("Một người chơi đã thoát. Game kết thúc.");
        }

        if (players.length === 0 && gameState !== 'WAITING') {
            initializeGame();
        }
    });
});

console.log('Máy chủ Odd/Even Tic-Tac-Toe đã khởi động trên cổng 8080');