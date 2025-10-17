// server/src/utils/helpers.js
const WebSocket = require('ws');
const { rooms } = require('./state'); // Sửa đường dẫn

const getPlayersInfo = (room) => room.players.map(p => ({
    role: p.playerRole,
    name: p.playerName,
    isConnected: p.ws.readyState === WebSocket.OPEN,
}));

const broadcastToRoom = (roomId, data, exceptWs = null) => {
    const room = rooms[roomId];
    if (!room) return;
    room.players.forEach(p => {
        if (p.ws !== exceptWs && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify(data));
        }
    });
};

module.exports = {
    getPlayersInfo,
    broadcastToRoom,
};