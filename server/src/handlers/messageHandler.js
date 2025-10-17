// server/src/handlers/messageHandler.js
const { v4: uuidv4 } = require('uuid');
const { createNewRoom } = require('../game/Room');
const { rooms, sessions } = require('../utils/state'); // Lấy từ state
const { getPlayersInfo, broadcastToRoom } = require('../utils/helpers');
const { checkGameStatus } = require('../game/gameLogic');

function handleMessage(ws, message) {
    const { type, payload } = JSON.parse(message);
    const currentSessionId = ws.sessionId;

    if (type === 'RECONNECT') {
        const oldSessionId = payload.sessionId;
        const oldSession = sessions[oldSessionId];

        if (oldSession && oldSession.roomId && rooms[oldSession.roomId]) {
            const room = rooms[oldSession.roomId];
            const player = room.players.find(p => p.sessionId === oldSessionId);

            if (player && player.reconnectionTimer) {
                clearTimeout(player.reconnectionTimer);
                player.reconnectionTimer = null;
                player.ws = ws;
                ws.roomId = room.id;
                ws.sessionId = oldSessionId;

                delete sessions[currentSessionId];
                sessions[oldSessionId].ws = ws;

                console.log(`Player "${player.playerName}" reconnected successfully to room ${room.id}.`);
                const playersInfo = getPlayersInfo(room);
                ws.send(JSON.stringify({ type: 'RECONNECT_SUCCESS', payload: { ...room, player: player.playerRole, playersInfo } }));
                broadcastToRoom(room.id, { type: 'PLAYER_RECONNECTED', payload: { playersInfo } }, ws);
            }
        }
        return;
    }

    // ... (Các phần code còn lại của hàm handleMessage giữ nguyên y hệt)
    if (type === 'CREATE_ROOM') {
        const { playerName } = payload;
        const roomId = uuidv4().substring(0, 6);
        rooms[roomId] = createNewRoom(roomId);
        ws.roomId = roomId;

        const newPlayer = { ws, playerRole: 'ODD', playerName, sessionId: ws.sessionId };
        rooms[roomId].players.push(newPlayer);
        sessions[ws.sessionId] = { ...sessions[ws.sessionId], roomId };

        console.log(`Room ${roomId} created by "${playerName}".`);
        ws.send(JSON.stringify({ type: 'ROOM_CREATED', payload: { roomId, player: 'ODD', board: rooms[roomId].board, playersInfo: getPlayersInfo(rooms[roomId]) } }));
        return;
    }

    if (type === 'JOIN_ROOM') {
        const { roomId, playerName } = payload;
        const room = rooms[roomId];

        if (!room) return ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Phòng không tồn tại.' } }));
        if (room.players.length >= 2) return ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Phòng đã đầy.' } }));

        ws.roomId = roomId;
        const newPlayer = { ws, playerRole: 'EVEN', playerName, sessionId: ws.sessionId };
        room.players.push(newPlayer);
        room.gameState = 'ACTIVE';
        sessions[ws.sessionId] = { ...sessions[ws.sessionId], roomId };


        console.log(`Player "${playerName}" joined room ${roomId}. Match starts.`);
        const playersInfo = getPlayersInfo(room);
        ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', payload: { roomId, player: 'EVEN', board: room.board, playersInfo } }));
        broadcastToRoom(roomId, { type: 'GAME_START', payload: { playersInfo, board: room.board } });
        return;
    }

    const { roomId } = ws;
    if (!roomId || !rooms[roomId]) return;
    const room = rooms[roomId];

    switch (type) {
        case 'INCREMENT':
            if (room.gameState !== 'ACTIVE') return;
            const player = room.players.find(p => p.ws === ws);
            if (!player) return;

            room.clickCounts[player.playerRole]++;
            room.board[payload.square]++;

            const { winner, winningLine } = checkGameStatus(room.board);
            const payloadUpdate = { board: room.board, clickCounts: room.clickCounts, playersInfo: getPlayersInfo(room) };

            if (winner) {
                room.gameState = 'GAME_OVER';
                room.winner = winner;
                room.winningLine = winningLine;
                broadcastToRoom(roomId, { type: 'GAME_OVER', payload: { winner, winningLine, ...payloadUpdate } });
            } else {
                broadcastToRoom(roomId, { type: 'GAME_UPDATE', payload: payloadUpdate });
            }
            break;

        case 'REQUEST_REMATCH':
            const requestingPlayer = room.players.find(p => p.ws === ws);
            if (requestingPlayer) {
                room.rematchRequests.add(requestingPlayer.playerRole);
                broadcastToRoom(roomId, { type: 'REMATCH_REQUESTED', payload: { player: requestingPlayer.playerRole } });

                if (room.rematchRequests.size === room.players.length) {
                    const oldPlayers = room.players;
                    rooms[roomId] = createNewRoom(roomId);
                    rooms[roomId].players = oldPlayers;
                    rooms[roomId].gameState = 'ACTIVE';
                    broadcastToRoom(roomId, { type: 'GAME_START', payload: { board: rooms[roomId].board, playersInfo: getPlayersInfo(rooms[roomId]), clickCounts: rooms[roomId].clickCounts } });
                }
            }
            break;
    }
}

module.exports = { handleMessage };