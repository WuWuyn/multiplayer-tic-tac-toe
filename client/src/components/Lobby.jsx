import React, { useState } from 'react';

const Lobby = ({ onCreateRoom, onJoinRoom }) => {
    const [roomIdInput, setRoomIdInput] = useState('');

    const handleJoin = (e) => {
        e.preventDefault();
        if (roomIdInput.trim()) {
            onJoinRoom(roomIdInput.trim());
        }
    };

    return (
        <div className="lobby-container">
            <h2>Tham gia hoặc Tạo phòng</h2>
            <div className="lobby-actions">
                <button className="lobby-button create-button" onClick={onCreateRoom}>
                    Tạo phòng mới
                </button>
                <form onSubmit={handleJoin} className="join-form">
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
        </div>
    );
};

export default Lobby;