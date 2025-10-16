import { useState, useEffect, useRef, useCallback } from 'react';
import Board from './components/Board';
import Lobby from './components/Lobby';
import './App.css';

const App = () => {
  // Các state không thay đổi...
  const [view, setView] = useState('lobby');
  const [status, setStatus] = useState('Đang kết nối đến máy chủ...');
  const socket = useRef(null);
  const handleServerMessageRef = useRef(null);
  const [roomId, setRoomId] = useState(null);
  const [board, setBoard] = useState(Array(25).fill(0));
  const [player, setPlayer] = useState(null);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [pendingMove, setPendingMove] = useState(null);
  const [rematchState, setRematchState] = useState({ requestedByMe: false, requestedByOpponent: false });

  const sendMessage = (type, payload = {}) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type, payload }));
    }
  };

  const handleServerMessage = useCallback((data) => {
    const { type, payload } = data;

    if (['GAME_UPDATE', 'GAME_OVER', 'GAME_START'].includes(type)) {
      setPendingMove(null);
    }

    switch (type) {
      case 'ROOM_CREATED':
        setRoomId(payload.roomId);
        setPlayer(payload.player);
        setBoard(payload.board);
        setView('game');
        setStatus('Đang chờ đối thủ tham gia...');
        break;
      // Xử lý khi tham gia phòng thành công
      case 'JOIN_SUCCESS':
        setRoomId(payload.roomId);
        setPlayer(payload.player);
        setBoard(payload.board);
        setView('game'); // Chuyển sang màn hình chơi game
        setStatus('Đã tham gia phòng, đợi trận đấu bắt đầu!');
        break;
      case 'GAME_START':
        // Nếu có board mới từ server (trường hợp chơi lại), cập nhật nó
        if (payload && payload.board) {
          setBoard(payload.board);
        }
        setWinner(null);
        setWinningLine([]);
        setRematchState({ requestedByMe: false, requestedByOpponent: false });
        setStatus('Trận đấu đã bắt đầu!');
        break;
      case 'GAME_UPDATE':
        setBoard(payload.board);
        break;
      case 'GAME_OVER':
        setBoard(payload.board);
        setWinner(payload.winner);
        setWinningLine(payload.winningLine || []);
        const winnerText = payload.winner === 'ODD' ? 'LẺ (ODD)' : 'CHẴN (EVEN)';
        setStatus(`Người thắng là phe ${winnerText}!`);
        break;
      case 'REMATCH_REQUESTED':
        if (payload.player !== player) {
          setRematchState(prev => ({ ...prev, requestedByOpponent: true }));
          setStatus(`Đối thủ muốn chơi lại...`);
        }
        break;
      case 'OPPONENT_DISCONNECTED':
        setWinner('DISCONNECT');
        setStatus('Đối thủ đã thoát. Trò chơi kết thúc.');
        break;
      case 'ERROR':
        setStatus(`Lỗi: ${payload.message}`);
        setTimeout(() => {
          // Chỉ reset status nếu vẫn đang ở lobby
          setView(v => {
            if (v === 'lobby') {
              setStatus('Vui lòng tạo hoặc tham gia phòng.');
            }
            return v;
          });
        }, 3000);
        break;
    }
  }, [player]); // Bỏ `view` ra khỏi dependency để tránh re-render không cần thiết

  // Phần còn lại của file App.jsx giữ nguyên...
  useEffect(() => {
    handleServerMessageRef.current = handleServerMessage;
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    socket.current = ws;

    ws.onopen = () => setStatus('Đã kết nối! Vui lòng tạo hoặc tham gia phòng.');
    ws.onclose = () => setStatus('Đã mất kết nối. Vui lòng tải lại trang.');
    ws.onerror = () => setStatus('Không thể kết nối đến máy chủ.');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (handleServerMessageRef.current) {
        handleServerMessageRef.current(data);
      }
    };

    return () => ws.close();
  }, []);

  const handleCreateRoom = () => sendMessage('CREATE_ROOM');
  const handleJoinRoom = (id) => sendMessage('JOIN_ROOM', { roomId: id });
  const handleSquareClick = (index) => {
    if (!winner) {
      const newBoard = [...board];
      newBoard[index] += 1;
      setBoard(newBoard);
      setPendingMove(index);
      sendMessage('INCREMENT', { square: index });
    }
  };
  const handleRematch = () => {
    if (winner) {
      sendMessage('REQUEST_REMATCH');
      setRematchState(prev => ({ ...prev, requestedByMe: true }));
      setStatus('Đã gửi yêu cầu chơi lại...');
    }
  };

  const getPlayerStyle = (p) => (p === 'ODD' ? 'player-X' : 'player-O');

  return (
    <div className="app-container">
      <div className="app">
        <header>
          <h1>Odd/Even Tic-Tac-Toe</h1>
        </header>
        <main>
          {view === 'lobby' ? (
            <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
          ) : (
            <>
              <div className="game-info-bar">
                <p><strong>Phòng:</strong> {roomId}</p>
                {player && <p><strong>Bạn là phe:</strong> <span className={getPlayerStyle(player)}>{player === 'ODD' ? 'LẺ' : 'CHẴN'}</span></p>}
              </div>
              <Board
                board={board}
                onClick={handleSquareClick}
                winningLine={winningLine}
                pendingMove={pendingMove}
                disabled={!!winner || !player || (view === 'game' && status.startsWith('Đang chờ'))}
              />
              {winner && winner !== 'DISCONNECT' && (
                <button
                  className="rematch-button"
                  onClick={handleRematch}
                  disabled={rematchState.requestedByMe}
                >
                  {rematchState.requestedByMe ? 'Đã gửi yêu cầu...' : (rematchState.requestedByOpponent ? 'Đồng ý chơi lại' : 'Chơi lại')}
                </button>
              )}
            </>
          )}
          <div className="status-bar global-status">
            <p><strong>Trạng thái:</strong> {status}</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;