import React, { useState } from 'react';

const Lobby = ({ onCreateRoom, onJoinRoom, onShowInstructions }) => {
    const [roomIdInput, setRoomIdInput] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [preferredRole, setPreferredRole] = useState('ODD'); // Giá trị mặc định là LẺ

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
            <h2>Tham gia hoặc Tạo phòng</h2>
            <div className="lobby-actions">
                <input
                    type="text"
                    placeholder="Nhập tên của bạn..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="lobby-input player-name-input"
                    maxLength={15}
                />

                <div className="role-selector">
                    <span>Chọn phe khi tạo phòng:</span>
                    <label>
                        <input
                            type="radio"
                            value="ODD"
                            checked={preferredRole === 'ODD'}
                            onChange={() => setPreferredRole('ODD')}
                        />
                        LẺ
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="EVEN"
                            checked={preferredRole === 'EVEN'}
                            onChange={() => setPreferredRole('EVEN')}
                        />
                        CHẴN
                    </label>
                </div>

                <button
                    className="lobby-button create-button"
                    onClick={handleCreateAction}
                >
                    Tạo phòng mới
                </button>

                <form onSubmit={handleJoinSubmit} className="join-form">
                    <input
                        type="text"
                        placeholder="Nhập ID phòng..."
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        className="lobby-input"
                    />
                    <button type="submit" className="lobby-button join-button">
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