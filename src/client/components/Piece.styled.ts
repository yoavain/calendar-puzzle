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

// Edge directions interface
export interface EdgeDirections {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
}

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
    transition: 'box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 'calc(100% - 50px)',
    minHeight: 200,

    // Selected state
    ...(isSelected && !isPlaced && {
        outline: `${theme.game.pieceBorderWidth}px solid ${theme.palette.primary.main}`,
        outlineOffset: 1,
        boxShadow: `0 0 0 3px ${theme.palette.primary.main}, 0 2px 8px rgba(0,0,0,0.16)`,
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
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

    '&:active': {
        cursor: 'grabbing',
    },
}));

// Piece cell props
export interface PieceCellProps {
    isFilled?: boolean;
    edges?: EdgeDirections;
}

// Piece cell (individual cells within a piece)
export const PieceCell = styled('div')<PieceCellProps>(({ theme, isFilled, edges }) => ({
    width: theme.game.cellSize,
    height: theme.game.cellSize,
    border: 'none',
    outline: 'none',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    display: 'block',

    // Empty cell styling
    ...(!isFilled && {
        backgroundColor: 'transparent',
        visibility: 'hidden',
    }),

    // Filled cell styling
    ...(isFilled && {
        backgroundColor: theme.game.pieceColor,
        color: '#ffffff',

        // Edge borders
        ...(edges?.top && {
            borderTop: `2px solid ${theme.game.pieceBorderColor}`,
        }),
        ...(edges?.right && {
            borderRight: `2px solid ${theme.game.pieceBorderColor}`,
        }),
        ...(edges?.bottom && {
            borderBottom: `2px solid ${theme.game.pieceBorderColor}`,
        }),
        ...(edges?.left && {
            borderLeft: `2px solid ${theme.game.pieceBorderColor}`,
        }),
    }),
}));
