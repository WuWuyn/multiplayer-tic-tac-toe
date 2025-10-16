import React from 'react';

const Square = ({ value, onClick, isWinning, isPending }) => {
    // Xác định style dựa trên giá trị chẵn/lẻ, nhưng chỉ khi giá trị > 0
    let playerClass = '';
    if (value > 0) {
        playerClass = value % 2 !== 0 ? 'player-X' : 'player-O'; // Lẻ là X, Chẵn là O
    }

    let className = `square ${playerClass}`;
    if (isWinning) className += ' winning';
    if (isPending) className += ' pending';

    // Hiển thị giá trị nếu nó lớn hơn 0
    const displayValue = value > 0 ? value : '';

    return (
        <button className={className} onClick={onClick}>
            {displayValue}
        </button>
    );
};

export default Square;