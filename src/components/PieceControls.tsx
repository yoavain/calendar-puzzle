import React from 'react';
import { Piece } from '../types/types';

interface PieceControlsProps {
    piece: Piece;
    onRotate: () => void;
    onFlipH: () => void;
    onFlipV: () => void;
}

export const PieceControls: React.FC<PieceControlsProps> = ({ piece, onRotate, onFlipH, onFlipV }) => {
    return (
        <div className="piece-controls">
            <button 
                onClick={onRotate}
                data-testid="rotate-button"
                aria-label="rotate piece"
            >⟳</button>
            <button 
                onClick={onFlipH}
                data-testid="flip-h-button"
                aria-label="flip horizontally"
            >↔️</button>
            <button 
                onClick={onFlipV}
                data-testid="flip-v-button"
                aria-label="flip vertically"
            >↕️</button>
        </div>
    );
};
