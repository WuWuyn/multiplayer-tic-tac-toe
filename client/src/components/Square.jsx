import React from 'react';

const Square = ({ value, onClick, isWinning }) => {
    const playerClass = value ? `player-${value}` : '';
    let className = `square ${playerClass}`;
    if (isWinning) {
        className += ' winning';
    }

    return (
        <button className={className} onClick={onClick} disabled={!!value}>
            {value}
        </button>
    );
};

export default Square;