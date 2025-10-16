import React, { useState } from 'react';

const Lobby = ({ onCreateRoom, onJoinRoom, onShowInstructions }) => {
    const [roomIdInput, setRoomIdInput] = useState('');
    const [playerName, setPlayerName] = useState('');

    const handleAction = (action) => {
        if (!playerName.trim()) {
            alert('Vui lòng nhập tên của bạn!');
            return;
        }
        action(playerName.trim());
    };

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        if (roomIdInput.trim()) {
            handleAction((name) => onJoinRoom(name, roomIdInput.trim()));
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

                <button
                    className="lobby-button create-button"
                    onClick={() => handleAction(onCreateRoom)}
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