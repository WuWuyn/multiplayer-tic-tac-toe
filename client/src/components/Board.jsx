import React from 'react';
import Square from './Square';

const Board = ({ board, onClick, winningLine, disabled }) => {
    return (
        <div className={`board ${disabled ? 'disabled' : ''}`}>
            {board.map((value, index) => (
                <Square
                    key={index}
                    value={value}
                    onClick={() => onClick(index)}
                    isWinning={winningLine.includes(index)}
                />
            ))}
        </div>
    );
};

export default Board;