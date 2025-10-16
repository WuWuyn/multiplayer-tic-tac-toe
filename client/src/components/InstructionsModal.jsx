import React from 'react';
import './InstructionsModal.css';

const InstructionsModal = ({ onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>🎮 Luật Chơi</h2>
                <div className="rules">
                    <p><strong>Cài đặt:</strong></p>
                    <ul>
                        <li>Bàn cờ 5x5, tất cả các ô bắt đầu từ 0.</li>
                        <li>Người chơi đầu tiên là <strong>Phe LẺ</strong>, người thứ hai là <strong>Phe CHẴN</strong>.</li>
                    </ul>
                    <p><strong>Cách chơi:</strong></p>
                    <ul>
                        <li>Click vào ô bất kỳ để tăng số của nó lên 1 (0 → 1 → 2...).</li>
                        <li>Cả hai người chơi có thể click bất cứ lúc nào (không theo lượt!).</li>
                    </ul>
                    <p><strong>Chiến thắng:</strong></p>
                    <ul>
                        <li><strong>Phe LẺ thắng</strong> nếu có một hàng, cột, hoặc đường chéo bất kỳ chứa đủ 5 số LẺ.</li>
                        <li><strong>Phe CHẴN thắng</strong> nếu có một hàng, cột, hoặc đường chéo bất kỳ chứa đủ 5 số CHẴN.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default InstructionsModal;