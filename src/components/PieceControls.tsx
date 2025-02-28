import React from 'react';
import { Piece } from '../types/types';

interface PieceControlsProps {
    piece: Piece;
    onRotate: () => void;
    onFlip: () => void;
}

const PieceControls: React.FC<PieceControlsProps> = ({ piece, onRotate, onFlip }) => {
    return (
        <div className="piece-controls">
            <button onClick={onRotate}>Rotate</button>
            <button onClick={onFlip}>Flip</button>
        </div>
    );
};

export default PieceControls; 