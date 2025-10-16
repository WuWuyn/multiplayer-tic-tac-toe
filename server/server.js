// server/server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// --- Trạng thái trò chơi (Game State) ---
let board;
let players = [];
let currentPlayer;
let gameState;
let clickCounts;
let rematchRequests;

const initializeGame = () => {
    board = Array(25).fill(null);
    currentPlayer = 'X';
    gameState = 'WAITING';
    clickCounts = { X: 0, O: 0 };
    rematchRequests = new Set();
    console.log("Máy chủ đã sẵn sàng, đang chờ người chơi.");
};

initializeGame();

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
        const [a, b, c, d, e] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c] && board[a] === board[d] && board[a] === board[e]) {
            return { winner: board[a], winningLine: line };
        }
    }
    if (board.every(square => square !== null)) {
        return { winner: 'DRAW', winningLine: [] };
    }
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
    ws.playerSymbol = (players.length === 1) ? 'X' : 'O';
    ws.send(JSON.stringify({ type: 'PLAYER_ASSIGNED', player: ws.playerSymbol }));
    console.log(`Người chơi ${players.length} (${ws.playerSymbol}) đã kết nối.`);

    if (players.length === 2) {
        gameState = 'ACTIVE';
        board = Array(25).fill(null);
        clickCounts = { X: 0, O: 0 };
        rematchRequests = new Set();
        broadcast({
            type: 'GAME_START',
            board,
            currentPlayer,
            clickCounts
        });
        console.log(`Game bắt đầu! Lượt của: ${currentPlayer}`);
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'MAKE_MOVE' && gameState === 'ACTIVE') {
            const squareIndex = data.square;
            if (ws.playerSymbol === currentPlayer && board[squareIndex] === null) {
                board[squareIndex] = currentPlayer;
                clickCounts[currentPlayer]++;

                const { winner, winningLine } = checkGameStatus();

                if (winner) {
                    gameState = 'GAME_OVER';
                    broadcast({ type: 'GAME_OVER', winner, winningLine, board, clickCounts });
                    console.log(`Game kết thúc. Kết quả: ${winner}`);
                } else {
                    currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
                    broadcast({ type: 'GAME_UPDATE', board, currentPlayer, clickCounts });
                }
            }
        } else if (data.type === 'REQUEST_REMATCH' && gameState === 'GAME_OVER') {
            rematchRequests.add(ws.playerSymbol);
            broadcast({ type: 'REMATCH_REQUESTED', player: ws.playerSymbol });

            if (rematchRequests.size === 2) {
                console.log("Cả hai người chơi đồng ý chơi lại. Bắt đầu ván mới.");
                gameState = 'ACTIVE';
                board = Array(25).fill(null);
                currentPlayer = 'X';
                clickCounts = { X: 0, O: 0 };
                rematchRequests = new Set();
                broadcast({ type: 'GAME_START', board, currentPlayer, clickCounts });
            }
        }
    });

    ws.on('close', () => {
        console.log(`Client (${ws.playerSymbol || 'chưa xác định'}) đã ngắt kết nối.`);
        const wasInGame = players.includes(ws);
        players = players.filter(p => p !== ws);

        if (wasInGame && gameState !== 'GAME_OVER') {
            gameState = 'GAME_OVER';
            // Chỉ broadcast cho người chơi còn lại
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

console.log('Máy chủ Tic-Tac-Toe 5x5 (Nâng cao) đã khởi động trên cổng 8080');
