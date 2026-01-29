import { styled } from "@mui/material/styles";
import { keyframes } from "@emotion/react";
import { getPieceColor } from "../../common/pieceData";

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
export const BoardContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    backgroundColor: theme.game.backgroundTertiary,
    padding: theme.game.cellSizePx,
    border: `4px solid ${theme.game.boardBorderColor}`,
    borderRadius: 22,
    boxShadow: "0 4px 16px rgba(0,0,0,0.10), 0 1.5px 4px rgba(0,0,0,0.08)",
    boxSizing: "content-box",
    width: `calc(${theme.game.cellSizePx} * 7)`,
    minWidth: `calc(${theme.game.cellSizePx} * 7)`,
    maxWidth: `calc(${theme.game.cellSizePx} * 7)`,
    marginLeft: "auto",
    marginRight: "auto",
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none"
}));

// Board row
export const BoardRow = styled("div")({
    display: "flex",
    gap: 0
});

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
    pieceId?: number;
    solutionRevealed?: boolean;
    isSolved?: boolean;
}

// Board cell
export const BoardCell = styled("div", {
    shouldForwardProp: (prop) => ![
        "isPlayable", 
        "isHighlighted", 
        "isPieceCell", 
        "isHidden", 
        "isStyled", 
        "isLocked", 
        "isInvalidDrop", 
        "isDragOver", 
        "pieceId", 
        "solutionRevealed", 
        "isSolved"
    ].includes(prop as string)
})<BoardCellProps>(({ 
    theme, 
    isPlayable, 
    isHighlighted, 
    isPieceCell, 
    isHidden,
    isStyled,
    isLocked,
    isInvalidDrop,
    isDragOver,
    pieceId,
    solutionRevealed,
    isSolved
}) => ({
    width: theme.game.cellSizePx,
    height: theme.game.cellSizePx,
    border: `1px solid ${theme.game.boardBorderColor}`,
    display: isStyled ? "flex" : "block",
    alignItems: isStyled ? "center" : undefined,
    justifyContent: isStyled ? "center" : undefined,
    textAlign: isStyled ? "center" : undefined,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    cursor: isSolved ? "default" : "pointer",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    transition: "background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.15s ease, transform 0.15s ease",

    // Hidden cell
    ...(isHidden && {
        visibility: "hidden",
        pointerEvents: "none"
    }),

    // Non-playable cell
    ...(!isPlayable && !isPieceCell && {
        backgroundColor: theme.game.hoverColor,
        cursor: isSolved ? "default" : "not-allowed",
        color: theme.game.disabledColor
    }),

    // Highlighted cell (current day and month)
    ...(isHighlighted && {
        backgroundColor: theme.game.highlightColor,
        color: theme.game.highlightTextColor,
        fontWeight: "bold",
        boxShadow: "inset 0 0 8px rgba(255, 200, 0, 0.5)"
    }),

    // Drag over feedback - enhanced visual cue for valid drop zones
    ...(isDragOver && {
        backgroundColor: `${theme.palette.primary.main}26`, // 15% opacity for stronger highlight
        boxShadow: `inset 0 0 12px ${theme.palette.primary.main}40, 0 0 8px ${theme.palette.primary.main}30`,
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: -2,
        transform: "scale(1.02)",
        zIndex: 5,
        position: "relative" as const
    }),

    // Playable cell hover (only when not a piece cell)
    ...(!isPieceCell && isPlayable && !isSolved && {
        "&:hover, &:focus": {
            backgroundColor: `${theme.palette.primary.main}1F`, // ~12% opacity
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
            zIndex: 2,
            position: "relative" as const
        }
    }),

    // Piece cell styling
    ...(isPieceCell && {
        backgroundColor: pieceId ? getPieceColor(pieceId) : getPieceColor(1),
        color: "#ffffff",
        border: 0,
        outline: "none",
        cursor: isSolved ? "default" : (isLocked ? "not-allowed" : "move"),
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        display: "block",
        // Subtle inset gradient for depth perception on placed pieces
        backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
        // Apply opacity for hinted pieces (30% faded) or solution revealed (15% faded)
        opacity: isLocked ? theme.game.hintedOpacity : (solutionRevealed ? theme.game.solutionRevealedOpacity : 1),
        
        ...(!isSolved && {
            "&:hover": {
                filter: isLocked ? "none" : "brightness(1.08)"
            }
        })
    }),

    // Invalid drop feedback
    ...(isInvalidDrop && {
        backgroundColor: `${theme.game.invalidDropColor} !important`,
        boxShadow: `inset 0 0 0 2px ${theme.game.invalidDropBorderColor} !important`,
        animation: `${invalidDropShake} 0.5s ease-in-out`,
        zIndex: 10,
        position: "relative" as const
    })
}));

// Styled cell text
export const StyledCellText = styled("span")({
    fontSize: "1em",
    fontWeight: "bold",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s ease"
});

// Drag preview container
export const DragPreviewContainer = styled("div")({
    position: "fixed",
    pointerEvents: "none",
    zIndex: 1000,
    display: "grid",
    gap: 0,
    backgroundColor: "transparent"
});

// Preview row
export const PreviewRow = styled("div")({
    display: "flex",
    gap: 0
});

// Preview cell props
export interface PreviewCellProps {
    isFilled?: boolean;
    pieceId?: number;
}

// Preview cell
export const PreviewCell = styled("div")<PreviewCellProps>(({ theme, isFilled, pieceId }) => ({
    width: theme.game.cellSizePx,
    height: theme.game.cellSizePx,
    border: "none",
    visibility: isFilled ? "visible" : "hidden",

    ...(isFilled && {
        backgroundColor: pieceId ? getPieceColor(pieceId) : getPieceColor(1),
        // Subtle gradient for depth perception in drag preview
        backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
    })
}));
