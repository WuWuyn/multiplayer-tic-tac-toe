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
    clickCounts: { ODD: 0, EVEN: 0 }, // Thêm bộ đếm click
    rematchRequests: new Set(),
});

const broadcastToRoom = (roomId, data) => {
    const room = rooms[roomId];
    if (!room) return;
    room.players.forEach(p => p.ws.readyState === WebSocket.OPEN && p.ws.send(JSON.stringify(data)));
};

const getPlayersInfo = (room) => room.players.map(p => ({ role: p.playerRole, name: p.playerName }));

const checkGameStatus = (board) => {
    for (const line of winningLines) {
        const values = line.map(index => board[index]);
        if (values.every(v => v > 0 && v % 2 !== 0)) return { winner: 'ODD', winningLine: line };
        if (values.every(v => v > 0 && v % 2 === 0)) return { winner: 'EVEN', winningLine: line };
    }
    return { winner: null };
};

wss.on('connection', (ws) => {
    ws.roomId = null;

    ws.on('message', (message) => {
        const { type, payload } = JSON.parse(message);

        if (type === 'CREATE_ROOM') {
            const { playerName } = payload;
            const roomId = uuidv4().substring(0, 6);
            rooms[roomId] = createNewRoom(roomId);

            ws.roomId = roomId;
            const newPlayer = { ws, playerRole: 'ODD', playerName };
            rooms[roomId].players.push(newPlayer);

            // THÊM LOG TẠI ĐÂY
            console.log(`Phòng ${roomId} đã được tạo bởi người chơi "${playerName}".`);

            ws.send(JSON.stringify({
                type: 'ROOM_CREATED',
                payload: { roomId, player: 'ODD', board: rooms[roomId].board, playersInfo: getPlayersInfo(rooms[roomId]) }
            }));
        } else if (type === 'JOIN_ROOM') {
            const { roomId, playerName } = payload;
            const room = rooms[roomId];

            if (!room || room.players.length >= 2) {
                // ... (logic xử lý lỗi không đổi)
                return;
            }

            ws.roomId = roomId;
            const newPlayer = { ws, playerRole: 'EVEN', playerName };
            room.players.push(newPlayer);
            room.gameState = 'ACTIVE';

            const playersInfo = getPlayersInfo(room);

            // THÊM LOG TẠI ĐÂY
            console.log(`Người chơi "${playerName}" đã tham gia phòng ${roomId}. Trận đấu bắt đầu.`);

            ws.send(JSON.stringify({
                type: 'JOIN_SUCCESS',
                payload: { roomId, player: 'EVEN', board: room.board, playersInfo }
            }));

            broadcastToRoom(roomId, { type: 'GAME_START', payload: { playersInfo } });
        }

        const { roomId } = ws;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];

        if (type === 'INCREMENT' && room.gameState === 'ACTIVE') {
            const player = room.players.find(p => p.ws === ws);
            if (!player) return;

            // Tăng bộ đếm click
            room.clickCounts[player.playerRole]++;

            const { square } = payload;
            room.board[square]++;
            const { winner, winningLine } = checkGameStatus(room.board);
            const payloadUpdate = { board: room.board, clickCounts: room.clickCounts };

            if (winner) {
                room.gameState = 'GAME_OVER';
                broadcastToRoom(roomId, { type: 'GAME_OVER', payload: { winner, winningLine, ...payloadUpdate } });
            } else {
                broadcastToRoom(roomId, { type: 'GAME_UPDATE', payload: payloadUpdate });
            }
        } else if (type === 'REQUEST_REMATCH') {
            // ... (Logic chơi lại không đổi nhiều, chỉ reset thêm clickCounts)
            const player = room.players.find(p => p.ws === ws);
            if (player) {
                room.rematchRequests.add(player.playerRole);
                broadcastToRoom(roomId, { type: 'REMATCH_REQUESTED', payload: { player: player.playerRole } });

                if (room.rematchRequests.size === 2) {
                    room.gameState = 'ACTIVE';
                    room.board = Array(25).fill(0);
                    room.clickCounts = { ODD: 0, EVEN: 0 }; // Reset click counts
                    room.rematchRequests.clear();
                    broadcastToRoom(roomId, { type: 'GAME_START', payload: { board: room.board, playersInfo: getPlayersInfo(room), clickCounts: room.clickCounts } });
                }
            }
        }
    });

    ws.on('close', () => {
        // Logic `on close` không thay đổi
        const { roomId } = ws;
        if (!roomId || !rooms[roomId]) return;

        const room = rooms[roomId];
        const playerIndex = room.players.findIndex(p => p.ws === ws);
        if (playerIndex === -1) return;

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

console.log('Máy chủ đã khởi động trên cổng 8080 với các tính năng UX mới.');