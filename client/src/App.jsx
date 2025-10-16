import { useState, useEffect, useRef, useCallback } from 'react';
import Board from './components/Board';
import './App.css'; // Import file CSS

const App = () => {
  const [board, setBoard] = useState(Array(25).fill(null));
  const [player, setPlayer] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [status, setStatus] = useState('Đang kết nối đến máy chủ...');
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [clickCounts, setClickCounts] = useState({ X: 0, O: 0 });
  const [pendingMove, setPendingMove] = useState(null);
  const [rematchState, setRematchState] = useState({ requestedByMe: false, requestedByOpponent: false });

  const socket = useRef(null);

  const updateStatusMessage = useCallback((currentTurn, myPlayer, currentWinner) => {
    if (currentWinner) {
      if (currentWinner === 'DRAW') setStatus('Kết quả: HÒA!');
      else if (currentWinner === 'DISCONNECT') setStatus('Đối thủ đã thoát. Trò chơi kết thúc.');
      else setStatus(`Người thắng là ${currentWinner}!`);
      return;
    }

    if (!myPlayer) {
      setStatus("Đang chờ đối thủ...");
      return;
    }

    if (currentTurn === myPlayer) setStatus('Đến lượt bạn!');
    else setStatus(`Đang chờ đối thủ (${currentTurn}) đi...`);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    socket.current = ws;

    ws.onopen = () => setStatus('Đã kết nối! Đang tìm trận...');
    ws.onclose = () => setStatus('Đã mất kết nối. Vui lòng tải lại trang.');
    ws.onerror = () => setStatus('Không thể kết nối đến máy chủ. Hãy đảm bảo server đang chạy.');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (['GAME_UPDATE', 'GAME_OVER', 'GAME_START'].includes(data.type)) {
        setPendingMove(null);
      }
      handleServerMessage(data);
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'PLAYER_ASSIGNED':
        setPlayer(data.player);
        setStatus('Đang chờ đối thủ...');
        break;
      case 'GAME_START':
        setBoard(data.board);
        setCurrentPlayer(data.currentPlayer);
        setClickCounts(data.clickCounts);
        setWinner(null);
        setWinningLine([]);
        setRematchState({ requestedByMe: false, requestedByOpponent: false });
        updateStatusMessage(data.currentPlayer, player || data.player, null);
        break;
      case 'GAME_UPDATE':
        setBoard(data.board);
        setCurrentPlayer(data.currentPlayer);
        setClickCounts(data.clickCounts);
        updateStatusMessage(data.currentPlayer, player, null);
        break;
      case 'GAME_OVER':
        setBoard(data.board);
        setCurrentPlayer(null);
        setWinner(data.winner);
        setWinningLine(data.winningLine || []);
        setClickCounts(data.clickCounts);
        updateStatusMessage(null, player, data.winner);
        break;
      case 'REMATCH_REQUESTED':
        setPlayer(p => {
          if (data.player !== p) {
            setRematchState(prev => ({ ...prev, requestedByOpponent: true }));
            setStatus(`Đối thủ muốn chơi lại...`);
          }
          return p;
        });
        break;
      case 'OPPONENT_DISCONNECTED':
        setWinner('DISCONNECT');
        updateStatusMessage(null, player, 'DISCONNECT');
        break;
      case 'ERROR':
        setStatus(`Lỗi: ${data.message}`);
        break;
    }
  };

  const handleSquareClick = (index) => {
    if (socket.current && currentPlayer === player && board[index] === null && !winner) {
      const newBoard = [...board];
      newBoard[index] = player;
      setBoard(newBoard);
      setPendingMove(index);
      socket.current.send(JSON.stringify({ type: 'MAKE_MOVE', square: index }));
    }
  };

  const handleRematch = () => {
    if (socket.current && winner) {
      socket.current.send(JSON.stringify({ type: 'REQUEST_REMATCH' }));
      setRematchState(prev => ({ ...prev, requestedByMe: true }));
      setStatus('Đã gửi yêu cầu chơi lại. Đang chờ đối thủ...');
    }
  };

  const gameState = winner ? 'GAME_OVER' : (currentPlayer ? 'ACTIVE' : 'WAITING');

  return (
    <div className="app-container">
      <div className="app">
        <header>
          <h1>Tic-Tac-Toe 5x5</h1>
        </header>
        <main>
          <div className="status-bar">
            <p><strong>Trạng thái:</strong> {status}</p>
            {player && <p><strong>Bạn là:</strong> <span className={`player-${player}`}>{player}</span></p>}
          </div>

          <div className="game-info">
            <div className="player-X">Lượt đi của X: {clickCounts.X}</div>
            <div className="player-O">Lượt đi của O: {clickCounts.O}</div>
          </div>

          <Board
            board={board}
            onClick={handleSquareClick}
            winningLine={winningLine}
            pendingMove={pendingMove}
            disabled={gameState !== 'ACTIVE' || currentPlayer !== player}
          />

          {gameState === 'GAME_OVER' && winner !== 'DISCONNECT' && (
            <button
              className="rematch-button"
              onClick={handleRematch}
              disabled={rematchState.requestedByMe}
            >
              {rematchState.requestedByMe ? 'Đã gửi yêu cầu...' : (rematchState.requestedByOpponent ? 'Đồng ý chơi lại' : 'Chơi lại')}
            </button>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;