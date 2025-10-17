// server.js
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { handleConnection } = require('./src/handlers/connectionHandler');
const { sessions } = require('./src/utils/state'); // Lấy sessions từ state

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    const sessionId = uuidv4();
    ws.sessionId = sessionId;
    sessions[sessionId] = { ws }; // Thêm session vào state
    ws.send(JSON.stringify({ type: 'SESSION_CREATED', payload: { sessionId } }));

    // Chỉ cần truyền vào ws, các handler khác sẽ lấy state từ file state.js
    handleConnection(ws);
});

console.log('🚀 WebSocket server started on port 8080. All issues fixed.');