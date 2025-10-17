// server/src/game/Room.js

// Hàm này giữ nguyên
const createNewRoom = (roomId) => ({
    id: roomId,
    players: [],
    board: Array(25).fill(0),
    gameState: 'WAITING',
    clickCounts: { ODD: 0, EVEN: 0 },
    rematchRequests: new Set(),
    winner: null,
    winningLine: [],
});

// Không cần export 'rooms' từ đây nữa
module.exports = {
    createNewRoom,
};