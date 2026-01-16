import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { keyframes } from '@emotion/react';

// Animations
export const pieceDropIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.85) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
`;

export const selectionPulse = keyframes`
    0% {
        box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.5);
    }
    50% {
        box-shadow: 0 0 0 8px rgba(0, 123, 255, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
    }
`;

// Piece wrapper props
export interface PieceWrapperProps {
    isSelected?: boolean;
    isPlaced?: boolean;
}

// Piece wrapper (the outer container for a piece in the pool)
export const PieceWrapper = styled(Box)<PieceWrapperProps>(({ theme, isSelected, isPlaced }) => ({
    cursor: isPlaced ? 'move' : 'grab',
    border: 'none',
    margin: 0,
    padding: 0,
    transition: 'box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1), outline 0.2s ease, outline-offset 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 'calc(100% - 50px)',
    minHeight: 200,
    borderRadius: 4,

    // Selected state
    ...(isSelected && !isPlaced && {
        outline: `${theme.game.pieceBorderWidth}px solid ${theme.palette.primary.main}`,
        outlineOffset: 1,
        boxShadow: `0 0 0 3px ${theme.palette.primary.main}, 0 2px 8px rgba(0,0,0,0.16)`,
        animation: `${selectionPulse} 0.5s ease-out`,
    }),

    // Selected and placed state
    ...(isSelected && isPlaced && {
        outline: `${theme.game.pieceBorderWidth}px solid ${theme.palette.success.main}`,
        outlineOffset: 1,
        border: 'none',
    }),

    // Placed state
    ...(isPlaced && {
        cursor: 'move',
        opacity: 1,
        animation: `${pieceDropIn} 0.35s cubic-bezier(0.4,0,0.2,1)`,
        
        '&:hover': {
            opacity: 1,
            boxShadow: `0 0 5px ${theme.palette.primary.main}`,
        },
    }),

    // Hover effect for non-placed pieces
    ...(!isPlaced && {
        '&:hover': {
            cursor: 'grab',
            boxShadow: '0 4px 16px rgba(0,123,255,0.18), 0 2px 8px rgba(0,0,0,0.14)',
            transform: 'translateY(-2px) scale(1.04)',
            zIndex: 3,
        },
        '&:active': {
            cursor: 'grabbing',
        },
    }),
}));

// Piece grid props
export interface PieceGridProps {
    columns: number;
    rows: number;
    transformStyle: string;
}

// Piece grid (the grid that contains piece cells)
export const PieceGrid = styled('div')<PieceGridProps>(({ theme, columns, rows, transformStyle }) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, ${theme.game.cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${theme.game.cellSize}px)`,
    gap: 0,
    backgroundColor: 'transparent',
    cursor: 'grab',
    border: 'none',
    margin: 0,
    padding: 0,
    transform: transformStyle,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, filter 0.25s ease',
    borderRadius: 2,
    // Prevent sub-pixel gaps between cells during transforms
    backfaceVisibility: 'hidden',
    // Default shadow for depth perception
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 1px 2px rgba(0,0,0,0.1))',

    '&:active': {
        cursor: 'grabbing',
    },

    '&:hover': {
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2)) drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
    },
}));

// Piece cell props
export interface PieceCellProps {
    isFilled?: boolean;
    pieceId?: number;
}

// Piece cell (individual cells within a piece)
export const PieceCell = styled('div')<PieceCellProps>(({ theme, isFilled, pieceId }) => ({
    width: theme.game.cellSize,
    height: theme.game.cellSize,
    border: 'none',
    outline: 'none',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    display: 'block',
    transition: 'background-color 0.2s ease',

    // Empty cell styling
    ...(!isFilled && {
        backgroundColor: 'transparent',
        visibility: 'hidden',
    }),

    // Filled cell styling - use box-shadow to fill gaps during transforms
    ...(isFilled && {
        backgroundColor: pieceId ? theme.game.pieceColors[pieceId - 1] : theme.game.pieceColors[0],
        color: '#ffffff',
        // Prevent sub-pixel gaps by extending color with box-shadow
        boxShadow: `inset 0 0 0 1px ${pieceId ? theme.game.pieceColors[pieceId - 1] : theme.game.pieceColors[0]}`,
    }),
}));
