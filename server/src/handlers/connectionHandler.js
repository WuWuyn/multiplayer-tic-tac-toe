// server/src/handlers/connectionHandler.js
const { handleMessage } = require('./messageHandler');
const { rooms, sessions, RECONNECTION_TIMEOUT } = require('../utils/state');
const { getPlayersInfo, broadcastToRoom } = require('../utils/helpers');
const { createNewRoom } = require('../game/Room'); // <--- THÊM DÒNG NÀY

function handleConnection(ws) {
    ws.on('message', (message) => handleMessage(ws, message));

    ws.on('close', () => {
        const { sessionId, roomId } = ws;

        if (!sessionId || !sessions[sessionId]) {
            return;
        }

        if (!roomId || !rooms[roomId]) {
            delete sessions[sessionId];
            return;
        }

        const room = rooms[roomId];
        const player = room.players.find(p => p.sessionId === sessionId);
        if (!player) return;

        if (room.players.length === 1) {
            delete rooms[roomId];
            delete sessions[sessionId];
            console.log(`Room ${roomId} was empty and has been deleted immediately.`);
            return;
        }

        console.log(`Player "${player.playerName}" disconnected from room ${roomId}. Starting timer.`);
        broadcastToRoom(roomId, { type: 'PLAYER_DISCONNECTED', payload: { playersInfo: getPlayersInfo(room) } });

        player.reconnectionTimer = setTimeout(() => {
            console.log(`Player "${player.playerName}" did not reconnect in time. Removing from room ${roomId}.`);

            const playerIndex = room.players.findIndex(p => p.sessionId === sessionId);
            if (playerIndex > -1) room.players.splice(playerIndex, 1);
            delete sessions[sessionId];

            if (room.players.length === 1) {
                const remainingPlayer = room.players[0];
                const newRoom = createNewRoom(roomId); // Sử dụng biến tạm để tránh nhầm lẫn
                newRoom.players.push(remainingPlayer);
                rooms[roomId] = newRoom; // Gán lại phòng đã được reset

                broadcastToRoom(roomId, {
                    type: 'OPPONENT_LEFT_GAME',
                    payload: {
                        winner: remainingPlayer.playerRole,
                        playersInfo: getPlayersInfo(rooms[roomId]),
                        board: rooms[roomId].board,
                        clickCounts: rooms[roomId].clickCounts,
                    }
                });
                console.log(`Player "${remainingPlayer.playerName}" wins by default. Room ${roomId} is now waiting for another player.`);

            } else if (room.players.length === 0) {
                delete rooms[roomId];
                console.log(`Room ${roomId} is now empty and has been deleted.`);
            }

        }, RECONNECTION_TIMEOUT);
    });
}

module.exports = { handleConnection };