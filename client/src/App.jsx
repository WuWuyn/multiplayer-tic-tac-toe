import { useState, useEffect, useRef, useCallback } from 'react';
import Board from './components/Board';
import './App.css';

const App = () => {
  const [board, setBoard] = useState(Array(25).fill(0));
  const [player, setPlayer] = useState(null); // 'ODD' or 'EVEN'
  const [status, setStatus] = useState('Đang kết nối đến máy chủ...');
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [pendingMove, setPendingMove] = useState(null);
  const [rematchState, setRematchState] = useState({ requestedByMe: false, requestedByOpponent: false });

  const socket = useRef(null);

  const updateStatusMessage = useCallback((myPlayer, currentWinner) => {
    if (currentWinner) {
      if (currentWinner === 'DISCONNECT') setStatus('Đối thủ đã thoát. Trò chơi kết thúc.');
      else {
        const winnerText = currentWinner === 'ODD' ? 'LẺ (ODD)' : 'CHẴN (EVEN)';
        setStatus(`Người thắng là phe ${winnerText}!`);
      }
      return;
    }

    if (!myPlayer) {
      setStatus("Đang chờ đối thủ...");
      return;
    }

    setStatus('Trận đấu đang diễn ra!');

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
      if (socket.current) socket.current.close();
    };
  }, []);

  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'PLAYER_ASSIGNED':
        setPlayer(data.player);
        updateStatusMessage(data.player, null);
        break;
      case 'WAITING_FOR_OPPONENT':
        setStatus('Đang chờ đối thủ...');
        break;
      case 'GAME_START':
        setBoard(data.board);
        setWinner(null);
        setWinningLine([]);
        setRematchState({ requestedByMe: false, requestedByOpponent: false });
        updateStatusMessage(player, null);
        break;
      case 'GAME_UPDATE':
        setBoard(data.board);
        break; // Không cần cập nhật status vì nó không đổi
      case 'GAME_OVER':
        setBoard(data.board);
        setWinner(data.winner);
        setWinningLine(data.winningLine || []);
        updateStatusMessage(player, data.winner);
        break;
      case 'REMATCH_REQUESTED':
        if (data.player !== player) {
          setRematchState(prev => ({ ...prev, requestedByOpponent: true }));
          setStatus(`Đối thủ muốn chơi lại...`);
        }
        break;
      case 'OPPONENT_DISCONNECTED':
        setWinner('DISCONNECT');
        updateStatusMessage(player, 'DISCONNECT');
        break;
      case 'ERROR':
        setStatus(`Lỗi: ${data.message}`);
        break;
    }
  };

  const handleSquareClick = (index) => {
    // Cho phép click nếu game đang diễn ra (chưa có người thắng)
    if (socket.current && !winner) {
      // Optimistic update
      const newBoard = [...board];
      newBoard[index] += 1;
      setBoard(newBoard);
      setPendingMove(index);

      // Gửi hành động INCREMENT lên server
      socket.current.send(JSON.stringify({ type: 'INCREMENT', square: index }));
    }
  };

  const handleRematch = () => {
    if (socket.current && winner) {
      socket.current.send(JSON.stringify({ type: 'REQUEST_REMATCH' }));
      setRematchState(prev => ({ ...prev, requestedByMe: true }));
      setStatus('Đã gửi yêu cầu chơi lại. Đang chờ đối thủ...');
    }
  };

  const gameState = winner ? 'GAME_OVER' : (player ? 'ACTIVE' : 'WAITING');
  const getPlayerStyle = (p) => {
    if (p === 'ODD') return 'player-X'; // Dùng lại style của X cho phe Lẻ
    if (p === 'EVEN') return 'player-O'; // Dùng lại style của O cho phe Chẵn
    return '';
  }

  return (
    <div className="app-container">
      <div className="app">
        <header>
          <h1>Odd/Even Tic-Tac-Toe</h1>
        </header>
        <main>
          <div className="status-bar">
            <p><strong>Trạng thái:</strong> {status}</p>
            {player && <p><strong>Bạn là phe:</strong> <span className={getPlayerStyle(player)}>{player === 'ODD' ? 'LẺ' : 'CHẴN'}</span></p>}
          </div>

          <Board
            board={board}
            onClick={handleSquareClick}
            winningLine={winningLine}
            pendingMove={pendingMove}
            disabled={gameState !== 'ACTIVE'}
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