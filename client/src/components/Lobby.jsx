import React, { useState } from 'react';

const Lobby = ({ onCreateRoom, onJoinRoom, onShowInstructions }) => {
    const [roomIdInput, setRoomIdInput] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [preferredRole, setPreferredRole] = useState('ODD');

    const handleCreateAction = () => {
        if (!playerName.trim()) {
            alert('Vui lòng nhập tên của bạn!');
            return;
        }
        onCreateRoom(playerName.trim(), preferredRole);
    };

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        if (!playerName.trim()) {
            alert('Vui lòng nhập tên của bạn!');
            return;
        }
        if (roomIdInput.trim()) {
            onJoinRoom(playerName.trim(), roomIdInput.trim());
        }
    };

    return (
        <div className="lobby-container">
            <h2>Chào mừng đến với trò chơi!</h2>
            <div className="lobby-actions">
                <input
                    type="text"
                    placeholder="Nhập tên của bạn..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="lobby-input"
                    maxLength={15}
                />

                <div className="role-selector">
                    <label>
                        <input
                            type="radio"
                            value="ODD"
                            checked={preferredRole === 'ODD'}
                            onChange={() => setPreferredRole('ODD')}
                        />
                        <span>LẺ</span>
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="EVEN"
                            checked={preferredRole === 'EVEN'}
                            onChange={() => setPreferredRole('EVEN')}
                        />
                        <span>CHẴN</span>
                    </label>
                </div>

                <button
                    className="btn"
                    onClick={handleCreateAction}
                >
                    Tạo phòng mới
                </button>

                <form onSubmit={handleJoinSubmit} className="join-form">
                    <input
                        type="text"
                        placeholder="Nhập ID phòng để tham gia..."
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        className="lobby-input"
                    />
                    <button type="submit" className="btn">
                        Tham gia
                    </button>
                </form>
            </div>
            <button className="instructions-button" onClick={onShowInstructions}>
                ? Hướng dẫn chơi
            </button>
        </div>
    );
};

export default Lobby;