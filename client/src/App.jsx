import { useState, useEffect, useRef, useCallback } from 'react';
import Board from './components/Board';
import Lobby from './components/Lobby';
import InstructionsModal from './components/InstructionsModal';
import './App.css';

const App = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [playersInfo, setPlayersInfo] = useState([]);
  const [clickCounts, setClickCounts] = useState({ ODD: 0, EVEN: 0 });
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
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type, payload }));
    }
  };

  const handleServerMessage = useCallback((data) => {
    const { type, payload } = data;

    if (payload?.clickCounts) setClickCounts(payload.clickCounts);
    if (payload?.playersInfo) setPlayersInfo(payload.playersInfo);

    switch (type) {
      case 'ROOM_CREATED':
      case 'JOIN_SUCCESS':
        setRoomId(payload.roomId);
        setPlayer(payload.player);
        setBoard(payload.board);
        setView('game');
        setStatus(type === 'ROOM_CREATED' ? 'Đang chờ đối thủ...' : 'Đã tham gia phòng!');
        break;
      case 'GAME_START':
        if (payload?.board) setBoard(payload.board);
        setWinner(null);
        setWinningLine([]);
        setRematchState({ requestedByMe: false, requestedByOpponent: false });
        setStatus('Trận đấu đã bắt đầu!');
        break;
      case 'GAME_UPDATE':
        setBoard(payload.board);
        setPendingMove(null);
        break;
      case 'GAME_OVER':
        setBoard(payload.board);
        setWinner(payload.winner);
        setWinningLine(payload.winningLine || []);
        const winnerText = payload.winner === 'ODD' ? 'LẺ (ODD)' : 'CHẴN (EVEN)';
        setStatus(`Người thắng là phe ${winnerText}!`);
        setPendingMove(null);
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
        break;
    }
  }, [player]);

  useEffect(() => { handleServerMessageRef.current = handleServerMessage; });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    socket.current = ws;
    ws.onopen = () => setStatus('Đã kết nối!');
    ws.onclose = () => setStatus('Đã mất kết nối.');
    ws.onmessage = (event) => handleServerMessageRef.current?.(JSON.parse(event.data));
    return () => ws.close();
  }, []);

  const handleCreateRoom = (playerName) => sendMessage('CREATE_ROOM', { playerName });
  const handleJoinRoom = (playerName, id) => sendMessage('JOIN_ROOM', { playerName, roomId: id });

  const handleSquareClick = (index) => {
    // Xác định điều kiện vô hiệu hóa bàn cờ
    const isDisabled = !!winner || status.startsWith('Đang chờ');

    // Nếu bàn cờ bị vô hiệu hóa hoặc đang có một nước đi chờ xử lý, không làm gì cả
    if (isDisabled || pendingMove) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] += 1;
    setBoard(newBoard);
    setPendingMove(index);
    sendMessage('INCREMENT', { square: index });
  };

  const handleRematch = () => {
    if (winner && winner !== 'DISCONNECT') {
      sendMessage('REQUEST_REMATCH');
      setRematchState(prev => ({ ...prev, requestedByMe: true }));
      setStatus('Đã gửi yêu cầu chơi lại...');
    }
  };

  const getPlayerStyle = (p) => (p === 'ODD' ? 'player-X' : 'player-O');

  const oddPlayer = playersInfo.find(p => p.role === 'ODD');
  const evenPlayer = playersInfo.find(p => p.role === 'EVEN');
  const currentPlayerInfo = playersInfo.find(p => p.role === player);

  return (
    <div className="app-container">
      {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
      <div className="app">
        <header><h1>Odd/Even Tic-Tac-Toe</h1></header>
        <main>
          {view === 'lobby' ? (
            <Lobby
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onShowInstructions={() => setShowInstructions(true)}
            />
          ) : (
            <>
              <div className="game-info-bar">
                <p><strong>Phòng:</strong> {roomId}</p>
                <p><strong>Bạn là:</strong> <span className={getPlayerStyle(player)}>{currentPlayerInfo?.name || '...'} ({player})</span></p>
              </div>

              <div className="players-display">
                <div className="player-card player-X">
                  <span className="player-name">{oddPlayer?.name || 'Đang chờ...'} (LẺ)</span>
                  <span className="player-clicks">Clicks: {clickCounts.ODD}</span>
                </div>
                <div className="vs-separator">VS</div>
                <div className="player-card player-O">
                  <span className="player-name">{evenPlayer?.name || 'Đang chờ...'} (CHẴN)</span>
                  <span className="player-clicks">Clicks: {clickCounts.EVEN}</span>
                </div>
              </div>

              <Board
                board={board}
                onClick={handleSquareClick}
                winningLine={winningLine}
                pendingMove={pendingMove}
                disabled={!!winner || status.startsWith('Đang chờ')}
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
          <div className="status-bar global-status"><p><strong>Trạng thái:</strong> {status}</p></div>
        </main>
      </div>
    </div>
  );
};

export default App;