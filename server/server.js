// server.js
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });

let rooms = {};

const winningLines = [
    [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
];

const createNewRoom = (roomId) => ({
    id: roomId,
    players: [],
    board: Array(25).fill(0),
    gameState: 'WAITING',
    rematchRequests: new Set(),
});

const broadcastToRoom = (roomId, data, excludeWs = null) => {
    const room = rooms[roomId];
    if (!room) return;

    room.players.forEach(client => {
        if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(data));
        }
    });
};

const checkGameStatus = (board) => {
    for (const line of winningLines) {
        const values = line.map(index => board[index]);
        if (values.every(v => v > 0 && v % 2 !== 0)) return { winner: 'ODD', winningLine: line };
        if (values.every(v => v > 0 && v % 2 === 0)) return { winner: 'EVEN', winningLine: line };
    }
    return { winner: null };
};

wss.on('connection', (ws) => {
    console.log('Một client đã kết nối.');
    ws.roomId = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const { type, payload } = data;

        if (type === 'CREATE_ROOM') {
            const roomId = uuidv4().substring(0, 6);
            rooms[roomId] = createNewRoom(roomId);

            ws.roomId = roomId;
            const newPlayer = { ws, playerRole: 'ODD' };
            rooms[roomId].players.push(newPlayer);

            ws.send(JSON.stringify({
                type: 'ROOM_CREATED',
                payload: { roomId, player: 'ODD', board: rooms[roomId].board }
            }));
            console.log(`Phòng ${roomId} đã được tạo bởi người chơi ODD.`);
        } else if (type === 'JOIN_ROOM') {
            const { roomId } = payload;
            const room = rooms[roomId];

            if (!room || room.players.length >= 2) {
                const message = !room ? 'Phòng không tồn tại.' : 'Phòng đã đầy.';
                ws.send(JSON.stringify({ type: 'ERROR', payload: { message } }));
                return;
            }

            ws.roomId = roomId;
            const newPlayer = { ws, playerRole: 'EVEN' };
            room.players.push(newPlayer);
            room.gameState = 'ACTIVE';

            // Gửi tin nhắn thành công cho người vừa tham gia
            ws.send(JSON.stringify({
                type: 'JOIN_SUCCESS',
                payload: { roomId, player: 'EVEN', board: room.board }
            }));

            console.log(`Người chơi EVEN đã tham gia phòng ${roomId}. Bắt đầu game.`);
            broadcastToRoom(roomId, { type: 'GAME_START' });
        }

        const { roomId } = ws;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];

        if (type === 'INCREMENT' && room.gameState === 'ACTIVE') {
            const { square } = payload;
            if (square >= 0 && square < 25) {
                room.board[square]++;
                const { winner, winningLine } = checkGameStatus(room.board);

                if (winner) {
                    room.gameState = 'GAME_OVER';
                    broadcastToRoom(roomId, { type: 'GAME_OVER', payload: { winner, winningLine, board: room.board } });
                } else {
                    broadcastToRoom(roomId, { type: 'GAME_UPDATE', payload: { board: room.board } });
                }
            }
        } else if (type === 'REQUEST_REMATCH' && room.gameState === 'GAME_OVER') {
            const player = room.players.find(p => p.ws === ws);
            if (player) {
                room.rematchRequests.add(player.playerRole);
                broadcastToRoom(roomId, { type: 'REMATCH_REQUESTED', payload: { player: player.playerRole } });

                if (room.rematchRequests.size === 2) {
                    room.gameState = 'ACTIVE';
                    room.board = Array(25).fill(0);
                    room.rematchRequests.clear();
                    broadcastToRoom(roomId, { type: 'GAME_START', payload: { board: room.board } });
                }
            }
        }
    });

    ws.on('close', () => {
        const { roomId } = ws;
        if (!roomId || !rooms[roomId]) {
            console.log('Client chưa tham gia phòng nào đã ngắt kết nối.');
            return;
        }

        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.ws === ws);

        if (playerIndex === -1) return;

        const disconnectedPlayer = room.players[playerIndex];
        console.log(`Client (${disconnectedPlayer?.playerRole || 'chưa xác định'}) trong phòng ${roomId} đã ngắt kết nối.`);

        room.players.splice(playerIndex, 1);

        if (room.players.length === 0) {
            delete rooms[roomId];
            console.log(`Phòng ${roomId} đã trống và bị xóa.`);
        } else {
            if (room.gameState !== 'GAME_OVER') {
                room.gameState = 'GAME_OVER';
                broadcastToRoom(roomId, { type: 'OPPONENT_DISCONNECTED' });
            }
        }
    });
});

console.log('Máy chủ Odd/Even Tic-Tac-Toe (có phòng chơi) đã khởi động trên cổng 8080');