import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import './App.css';

const App = () => {
  // Chỉ lưu instance của socket, không cần setState cho nó
  const [socket, setSocket] = useState(null);
  const [board, setBoard] = useState(Array(25).fill(null));
  const [player, setPlayer] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [status, setStatus] = useState('Đang kết nối đến máy chủ...');
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);

  // **SỬA LỖI QUAN TRỌNG TẠI ĐÂY**
  // useEffect với mảng rỗng [] chỉ chạy MỘT LẦN khi component được mount.
  // Điều này ngăn việc tạo và hủy kết nối WebSocket liên tục.
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    setSocket(ws);

    ws.onopen = () => setStatus('Đã kết nối!');

    ws.onclose = () => {
      setStatus('Đã mất kết nối. Vui lòng tải lại trang.');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Dùng một hàm riêng để xử lý message, giúp code sạch hơn
      handleServerMessage(data);
    };

    // Hàm cleanup, sẽ chạy khi component unmount (ví dụ: khi đóng tab)
    return () => {
      ws.close();
    };
  }, []); // <--- Mảng rỗng là mấu chốt của việc sửa lỗi!

  // Tách logic xử lý message ra một hàm riêng
  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'PLAYER_ASSIGNED':
        setPlayer(data.player);
        setStatus('Đang chờ đối thủ...');
        break;
      case 'GAME_START':
        setBoard(data.board);
        setCurrentPlayer(data.currentPlayer);
        setWinner(null);
        setWinningLine([]);
        // Cần truyền player vào vì state 'player' có thể chưa cập nhật ngay
        updateStatus(data.currentPlayer, player || data.player);
        break;
      case 'GAME_UPDATE':
        setBoard(data.board);
        setCurrentPlayer(data.currentPlayer);
        updateStatus(data.currentPlayer, player);
        break;
      case 'GAME_OVER':
        setBoard(data.board);
        setCurrentPlayer(null);
        setWinner(data.winner);
        setWinningLine(data.winningLine || []);
        if (data.winner === 'DRAW') {
          setStatus('Kết quả: HÒA!');
        } else {
          setStatus(`Người thắng là ${data.winner}!`);
        }
        break;
      case 'OPPONENT_DISCONNECTED':
        setStatus('Đối thủ đã thoát. Trò chơi kết thúc.');
        setWinner('DISCONNECT');
        break;
      case 'ERROR':
        setStatus(`Lỗi: ${data.message}`);
        break;
    }
  };

  const updateStatus = (currentTurn, myPlayer) => {
    if (winner) return; // Không cập nhật status nếu đã có người thắng

    if (currentTurn === myPlayer) {
      setStatus('Đến lượt bạn!');
    } else {
      setStatus(`Đang chờ đối thủ (${currentTurn}) đi...`);
    }
  };

  const handleSquareClick = (index) => {
    if (socket && currentPlayer === player && board[index] === null && !winner) {
      socket.send(JSON.stringify({
        type: 'MAKE_MOVE',
        square: index
      }));
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Tic-Tac-Toe 5x5 Online</h1>
      </header>
      <main>
        <div className="status-bar">
          <p><strong>Trạng thái:</strong> {status}</p>
          {player && <p><strong>Bạn là:</strong> <span className={`player-${player}`}>{player}</span></p>}
        </div>

        <Board
          board={board}
          onClick={handleSquareClick}
          winningLine={winningLine}
          disabled={winner !== null || currentPlayer !== player}
        />
      </main>
    </div>
  );
};

export default App;

