// server/server.js
const WebSocket = require('ws');

// Khởi tạo WebSocket server trên cổng 8080
const wss = new WebSocket.Server({ port: 8080 });

// --- Trạng thái trò chơi (Game State) ---
let board = Array(25).fill(null);
let players = [];
let currentPlayer = 'X';
let gameState = 'WAITING';

// Các chuỗi thắng
const winningLines = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
];

// --- Các hàm tiện ích ---
const broadcast = (data) => {
    wss.clients.forEach(client => {
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

const resetGameForNewPlayers = () => {
    board = Array(25).fill(null);
    currentPlayer = 'X';
    gameState = 'WAITING';
    players = [];
    console.log("Máy chủ đã reset, đang chờ người chơi mới.");
};

// --- Logic chính của WebSocket Server ---
wss.on('connection', (ws) => {
    console.log('Một client đã kết nối.');

    if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Phòng chơi đã đầy.' }));
        ws.close();
        return;
    }

    if (players.length === 0) {
        players.push(ws);
        ws.playerSymbol = 'X';
        ws.send(JSON.stringify({ type: 'PLAYER_ASSIGNED', player: 'X' }));
        console.log('Người chơi 1 (X) đã kết nối.');
    }
    else if (players.length === 1) {
        players.push(ws);
        ws.playerSymbol = 'O';
        ws.send(JSON.stringify({ type: 'PLAYER_ASSIGNED', player: 'O' }));
        console.log('Người chơi 2 (O) đã kết nối.');

        gameState = 'ACTIVE';
        broadcast({ type: 'GAME_START', board, currentPlayer });
        console.log(`Game bắt đầu! Lượt của: ${currentPlayer}`);
    }

    ws.on('message', (message) => {
        if (gameState !== 'ACTIVE') return;
        const data = JSON.parse(message);

        if (data.type === 'MAKE_MOVE') {
            const squareIndex = data.square;
            if (ws.playerSymbol === currentPlayer && board[squareIndex] === null) {
                board[squareIndex] = currentPlayer;
                const { winner, winningLine } = checkGameStatus();

                if (winner) {
                    gameState = 'GAME_OVER';
                    broadcast({ type: 'GAME_OVER', winner, winningLine, board });
                    console.log(`Game kết thúc. Kết quả: ${winner}`);
                } else {
                    currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
                    broadcast({ type: 'GAME_UPDATE', board, currentPlayer });
                }
            }
        }
    });

    ws.on('close', () => {
        console.log(`Client (${ws.playerSymbol || 'chưa xác định'}) đã ngắt kết nối.`);

        const playerWasInGame = players.includes(ws);
        players = players.filter(p => p !== ws);

        if (playerWasInGame && gameState !== 'GAME_OVER') {
            gameState = 'GAME_OVER';
            broadcast({ type: 'OPPONENT_DISCONNECTED' });
            console.log("Một người chơi đã thoát. Game kết thúc.");
        }

        if (players.length === 0) {
            resetGameForNewPlayers();
        }
    });
});

console.log('Máy chủ Tic-Tac-Toe 5x5 đã khởi động trên cổng 8080');

