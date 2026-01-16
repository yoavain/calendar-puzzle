import { styled } from '@mui/material/styles';
import { keyframes } from '@emotion/react';

// Animations
export const invalidDropShake = keyframes`
    0%, 100% {
        transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
        transform: translateX(-4px);
    }
    20%, 40%, 60%, 80% {
        transform: translateX(4px);
    }
`;

// Board container
export const BoardContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
    backgroundColor: theme.game.backgroundTertiary,
    padding: theme.game.cellSize,
    border: `4px solid ${theme.game.boardBorderColor}`,
    borderRadius: 22,
    boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1.5px 4px rgba(0,0,0,0.08)',
    boxSizing: 'content-box',
    width: theme.game.cellSize * 7,
    minWidth: theme.game.cellSize * 7,
    maxWidth: theme.game.cellSize * 7,
    marginLeft: 'auto',
    marginRight: 'auto',
}));

// Board row
export const BoardRow = styled('div')({
    display: 'flex',
    gap: 0,
});

// Edge directions interface
export interface EdgeDirections {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
}

// Board cell props
export interface BoardCellProps {
    isPlayable?: boolean;
    isHighlighted?: boolean;
    isPieceCell?: boolean;
    isHidden?: boolean;
    isStyled?: boolean;
    isLocked?: boolean;
    isInvalidDrop?: boolean;
    isDragOver?: boolean;
    edges?: EdgeDirections;
}

// Board cell
export const BoardCell = styled('div')<BoardCellProps>(({ 
    theme, 
    isPlayable, 
    isHighlighted, 
    isPieceCell, 
    isHidden,
    isStyled,
    isLocked,
    isInvalidDrop,
    isDragOver,
    edges 
}) => ({
    width: theme.game.cellSize,
    height: theme.game.cellSize,
    border: `1px solid ${theme.game.boardBorderColor}`,
    display: isStyled ? 'flex' : 'block',
    alignItems: isStyled ? 'center' : undefined,
    justifyContent: isStyled ? 'center' : undefined,
    textAlign: isStyled ? 'center' : undefined,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    cursor: 'pointer',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',

    // Hidden cell
    ...(isHidden && {
        visibility: 'hidden',
        pointerEvents: 'none',
    }),

    // Non-playable cell
    ...(!isPlayable && !isPieceCell && {
        backgroundColor: theme.game.hoverColor,
        cursor: 'not-allowed',
        color: theme.game.disabledColor,
    }),

    // Highlighted cell (current day and month)
    ...(isHighlighted && {
        backgroundColor: theme.game.highlightColor,
        color: '#000000',
        fontWeight: 'bold',
    }),

    // Drag over feedback
    ...(isDragOver && {
        backgroundColor: `${theme.palette.primary.main}1A`, // 10% opacity
        outline: `2px dashed ${theme.palette.primary.main}`,
    }),

    // Playable cell hover (only when not a piece cell)
    ...(!isPieceCell && isPlayable && {
        '&:hover, &:focus': {
            backgroundColor: `${theme.palette.primary.main}1F`, // ~12% opacity
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
            zIndex: 2,
            position: 'relative' as const,
        },
    }),

    // Piece cell styling
    ...(isPieceCell && {
        backgroundColor: isLocked ? theme.game.lockedPieceColor : theme.game.pieceColor,
        color: '#ffffff',
        border: 0,
        outline: 'none',
        cursor: isLocked ? 'not-allowed' : 'move',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        display: 'block',
        
        '&:hover': {
            opacity: isLocked ? 1 : 0.8,
        },

        // Edge borders for pieces on board
        ...(edges?.top && {
            borderTop: `2px solid ${isLocked ? theme.game.lockedPieceBorderColor : theme.game.boardBorderColor}`,
        }),
        ...(edges?.right && {
            borderRight: `2px solid ${isLocked ? theme.game.lockedPieceBorderColor : theme.game.boardBorderColor}`,
        }),
        ...(edges?.bottom && {
            borderBottom: `2px solid ${isLocked ? theme.game.lockedPieceBorderColor : theme.game.boardBorderColor}`,
        }),
        ...(edges?.left && {
            borderLeft: `2px solid ${isLocked ? theme.game.lockedPieceBorderColor : theme.game.boardBorderColor}`,
        }),
    }),

    // Invalid drop feedback
    ...(isInvalidDrop && {
        backgroundColor: `${theme.game.invalidDropColor} !important`,
        boxShadow: `inset 0 0 0 2px ${theme.game.invalidDropBorderColor} !important`,
        animation: `${invalidDropShake} 0.5s ease-in-out`,
        zIndex: 10,
        position: 'relative' as const,
    }),
}));

// Styled cell text
export const StyledCellText = styled('span')({
    fontSize: '1em',
    fontWeight: 'bold',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

// Drag preview container
export const DragPreviewContainer = styled('div')({
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 1000,
    display: 'grid',
    gap: 0,
    backgroundColor: 'transparent',
});

// Preview row
export const PreviewRow = styled('div')({
    display: 'flex',
    gap: 0,
});

// Preview cell props
export interface PreviewCellProps {
    isFilled?: boolean;
    edges?: EdgeDirections;
}

// Preview cell
export const PreviewCell = styled('div')<PreviewCellProps>(({ theme, isFilled, edges }) => ({
    width: theme.game.cellSize,
    height: theme.game.cellSize,
    border: 'none',
    visibility: isFilled ? 'visible' : 'hidden',

    ...(isFilled && {
        backgroundColor: theme.game.pieceColor,

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
