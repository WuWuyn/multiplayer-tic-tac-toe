import React from 'react';
import Square from './Square';

const Board = ({ board, onClick, winningLine, pendingMove, disabled }) => {
    return (
        <div className={`board ${disabled ? 'disabled' : ''}`}>
            {board.map((value, index) => (
                <Square
                    key={index}
                    value={value}
                    onClick={() => onClick(index)}
                    isWinning={winningLine.includes(index)}
                    isPending={pendingMove === index}
                />
            ))}
        </div>
    );
};

export default Board;