// server/src/utils/state.js
const rooms = {};
const sessions = {};
const RECONNECTION_TIMEOUT = 30 * 1000; // 30 giây

module.exports = {
    rooms,
    sessions,
    RECONNECTION_TIMEOUT,
};