import { useState, useEffect, useRef, useCallback } from 'react';
import Board from './components/Board';
import Lobby from './components/Lobby';
import InstructionsModal from './components/InstructionsModal';
import './App.css';

const WEBSOCKET_URL = 'ws://localhost:8080';

const App = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [playersInfo, setPlayersInfo] = useState([]);
  const [clickCounts, setClickCounts] = useState({ ODD: 0, EVEN: 0 });
  const [view, setView] = useState('lobby');
  const [status, setStatus] = useState('Đang kết nối đến máy chủ...');
  const socket = useRef(null);
  const handleServerMessageRef = useRef(null);
  const [roomId, setRoomId] = useState(null);
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [board, setBoard] = useState(Array(25).fill(0));
  const [player, setPlayer] = useState(null);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [pendingMove, setPendingMove] = useState(null);
  const [rematchState, setRematchState] = useState({ requestedByMe: false, requestedByOpponent: false });
  const reconnectionTimer = useRef(null);

  const resetGameState = () => {
    setRoomId(null);
    setPlayer(null);
    setBoard(Array(25).fill(0));
    setWinner(null);
    setWinningLine([]);
    setClickCounts({ ODD: 0, EVEN: 0 });
    setPlayersInfo([]);
    setRematchState({ requestedByMe: false, requestedByOpponent: false });
    setStatus('Bạn đã rời phòng.');
  };

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
      case 'SESSION_CREATED':
        setSessionId(payload.sessionId);
        localStorage.setItem('sessionId', payload.sessionId);
        break;
      case 'ROOM_CREATED':
      case 'JOIN_SUCCESS':
        setRoomId(payload.roomId);
        setPlayer(payload.player);
        setBoard(payload.board);
        setView('game');
        setWinner(null);
        setWinningLine([]);
        setStatus(type === 'ROOM_CREATED' ? 'Đang chờ đối thủ...' : 'Đã tham gia phòng!');
        break;
      case 'RECONNECT_SUCCESS':
        setView('game');
        setRoomId(payload.roomId);
        setPlayer(payload.player);
        setBoard(payload.board);
        setWinner(payload.winner);
        setWinningLine(payload.winningLine || []);
        setStatus('Đã kết nối lại thành công!');
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
      case 'PLAYER_RECONNECTED':
        setStatus('Đối thủ đã kết nối lại.');
        break;
      case 'PLAYER_DISCONNECTED':
        setStatus('Đối thủ đã mất kết nối. Đang chờ kết nối lại...');
        break;
      case 'OPPONENT_LEFT_GAME':
        setWinner(payload.winner);
        if (payload.board) setBoard(payload.board);
        if (payload.clickCounts) setClickCounts(payload.clickCounts);
        setStatus(`Bạn đã thắng! Đối thủ đã rời trận. Đang chờ người chơi mới...`);
        setRematchState({ requestedByMe: false, requestedByOpponent: false });
        break;
      case 'ERROR':
        setStatus(`Lỗi: ${payload.message}`);
        break;
    }
  }, [player]);

  useEffect(() => { handleServerMessageRef.current = handleServerMessage; });

  const connect = useCallback(() => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WEBSOCKET_URL);
    socket.current = ws;

    ws.onopen = () => {
      setStatus('Đã kết nối!');
      if (reconnectionTimer.current) {
        clearTimeout(reconnectionTimer.current);
        reconnectionTimer.current = null;
      }
      const currentSessionId = localStorage.getItem('sessionId');
      if (currentSessionId) {
        sendMessage('RECONNECT', { sessionId: currentSessionId });
      }
    };

    ws.onclose = () => {
      setStatus('Đã mất kết nối. Đang thử lại...');
      if (!reconnectionTimer.current) {
        reconnectionTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessageRef.current?.(data);
      } catch (error) {
        console.error("Lỗi xử lý tin nhắn từ server:", error);
      }
    };

    ws.onerror = (err) => {
      console.error("Lỗi WebSocket:", err);
      ws.close();
    };

  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectionTimer.current) clearTimeout(reconnectionTimer.current);
      socket.current?.close();
    };
  }, [connect]);

  const handleCreateRoom = (playerName, preferredRole) => sendMessage('CREATE_ROOM', { playerName, preferredRole });
  const handleJoinRoom = (playerName, id) => sendMessage('JOIN_ROOM', { playerName, roomId: id });

  const handleLeaveRoom = () => {
    if (window.confirm('Bạn có chắc chắn muốn thoát khỏi phòng chơi?')) {
      sendMessage('LEAVE_ROOM');
      setView('lobby');
      resetGameState();
    }
  };

  const handleSquareClick = (index) => {
    const isDisabled = !!winner || status.startsWith('Đang chờ') || status.includes('mất kết nối');
    if (isDisabled || pendingMove !== null) return;

    sendMessage('INCREMENT', { square: index });
    setPendingMove(index);
  };

  const handleRematch = () => {
    if (winner && playersInfo.length === 2) {
      sendMessage('REQUEST_REMATCH');
      setRematchState(prev => ({ ...prev, requestedByMe: true }));
      setStatus('Đã gửi yêu cầu chơi lại...');
    }
  };

  const getPlayerStyle = (p) => (p === 'ODD' ? 'player-X' : 'player-O');

  const oddPlayer = playersInfo.find(p => p.role === 'ODD');
  const evenPlayer = playersInfo.find(p => p.role === 'EVEN');
  const currentPlayerInfo = playersInfo.find(p => p.role === player);
  const canRematch = winner && winner !== 'DISCONNECT' && playersInfo.length === 2;

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
              <div className="game-header">
                <button className="back-button" onClick={handleLeaveRoom}>
                  &larr; Thoát phòng
                </button>
                <div className="game-info-bar">
                  <p><strong>Phòng:</strong> {roomId}</p>
                  <p><strong>Bạn là:</strong> <span className={getPlayerStyle(player)}>{currentPlayerInfo?.name || '...'} ({player})</span></p>
                </div>
              </div>

              <div className="players-display">
                <div className={`player-card player-X ${oddPlayer?.isConnected === false ? 'disconnected' : ''}`}>
                  <span className="player-name">{oddPlayer?.name || 'Đang chờ...'} (LẺ)</span>
                  <span className="player-clicks">Clicks: {clickCounts.ODD}</span>
                </div>
                <div className="vs-separator">VS</div>
                <div className={`player-card player-O ${evenPlayer?.isConnected === false ? 'disconnected' : ''}`}>
                  <span className="player-name">{evenPlayer?.name || 'Đang chờ...'} (CHẴN)</span>
                  <span className="player-clicks">Clicks: {clickCounts.EVEN}</span>
                </div>
              </div>

              <Board
                board={board}
                onClick={handleSquareClick}
                winningLine={winningLine}
                pendingMove={pendingMove}
                disabled={!!winner || status.startsWith('Đang chờ') || status.includes('mất kết nối')}
              />

              {canRematch && (
                <button className="rematch-button" onClick={handleRematch} disabled={rematchState.requestedByMe}>
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