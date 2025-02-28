import React from 'react';
import { Piece } from '../types/types';

interface PieceControlsProps {
    piece: Piece;
    onRotate: () => void;
    onFlipH: () => void;
    onFlipV: () => void;
}

const PieceControls: React.FC<PieceControlsProps> = ({ piece, onRotate, onFlipH, onFlipV }) => {
    return (
        <div className="piece-controls">
            <button onClick={onRotate}>⟳</button>
            <button onClick={onFlipH}>↔️</button>
            <button onClick={onFlipV}>↕️</button>
        </div>
    );
};

export default PieceControls; 