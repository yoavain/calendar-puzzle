import { alpha, styled } from "@mui/material/styles";
import { keyframes } from "@emotion/react";
import { getPieceColor, PIECE_CELL_GRADIENT } from "../utils/pieceColors";

// Animations
export const revealCellAnim = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

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

// A placed piece drops the last few pixels onto the board and flashes. Every
// cell of the piece runs it with the same timing, so the piece moves as one.
// It reaches the cell's resting opacity (--cell-opacity, below 1 for hinted
// pieces) as it touches down.
export const pieceLandAnim = keyframes`
    0% {
        opacity: 0;
        transform: translateY(-12px);
        animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
    }
    35% {
        opacity: var(--cell-opacity, 1);
        transform: translateY(0);
        filter: brightness(1.6);
        animation-timing-function: ease-out;
    }
    100% {
        transform: translateY(0);
        filter: brightness(1);
    }
`;

// Win sweep: each cell lifts and brightens, staggered by --win-delay so a
// diagonal wave crosses the board from the top-left corner.
export const winSweepAnim = keyframes`
    35% {
        transform: translateY(-4px);
        filter: brightness(1.45);
    }
`;

/** Per-cell delay for the win sweep, along the top-left -> bottom-right diagonal. */
export const winSweepDelay = (x: number, y: number): string => `${Math.round((x * 0.6 + y * 0.8) * 55)}ms`;

const REVEAL_ANIMATION = `${revealCellAnim} 0.3s ease-out var(--reveal-delay, 0ms) backwards`;

// Browsers match running animations by name, so adding or dropping the
// landing / sweep entries never restarts the reveal fade that precedes them.
const cellAnimation = (isLanding?: boolean, isCelebrating?: boolean): string => [
    REVEAL_ANIMATION,
    ...(isLanding ? [`${pieceLandAnim} 480ms 0ms`] : []),
    ...(isCelebrating ? [`${winSweepAnim} 560ms ease-out var(--win-delay, 0ms)`] : [])
].join(", ");

// Board container
export const BoardContainer = styled("div")(({ theme }) => ({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    backgroundColor: theme.game.backgroundTertiary,
    padding: theme.game.cellSizePx,
    border: `4px solid ${theme.game.boardBorderColor}`,
    borderRadius: theme.game.radius.board,
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
    /** Renders a keyboard-focus outline when the keyboard cursor is on this cell. */
    isKeyboardCursor?: boolean;
    /** Plays the landing animation (cell of the piece that was just placed). */
    isLanding?: boolean;
    /** Plays the win sweep (the board was just solved). */
    isCelebrating?: boolean;
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
        "isSolved",
        "isKeyboardCursor",
        "isLanding",
        "isCelebrating"
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
    isSolved,
    isKeyboardCursor,
    isLanding,
    isCelebrating
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
    animation: cellAnimation(isLanding, isCelebrating),
    "@media (prefers-reduced-motion: reduce)": {
        animation: REVEAL_ANIMATION
    },
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
        backgroundColor: alpha(theme.palette.primary.main, 0.15),
        boxShadow: `inset 0 0 12px ${alpha(theme.palette.primary.main, 0.25)}, 0 0 8px ${alpha(theme.palette.primary.main, 0.19)}`,
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: -2,
        transform: "scale(1.02)",
        zIndex: 5,
        position: "relative" as const
    }),

    // Playable cell hover / keyboard focus (only when not a piece cell)
    ...(!isPieceCell && isPlayable && !isSolved && {
        "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
            zIndex: 2,
            position: "relative" as const
        },
        "&:focus-visible": {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: -2,
            zIndex: 2,
            position: "relative" as const
        }
    }),

    // Piece cell styling
    ...(isPieceCell && {
        backgroundColor: pieceId ? getPieceColor(pieceId) : getPieceColor(1),
        color: theme.game.colors.onPieceText,
        border: 0,
        outline: "none",
        cursor: isSolved ? "default" : (isLocked ? "not-allowed" : "move"),
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        display: "block",
        // Subtle inset gradient for depth perception on placed pieces
        backgroundImage: PIECE_CELL_GRADIENT,
        // Apply opacity for hinted pieces (30% faded) or solution revealed (15% faded)
        opacity: "var(--cell-opacity)",
        "--cell-opacity": isLocked ? theme.game.hintedOpacity : (solutionRevealed ? theme.game.solutionRevealedOpacity : 1),

        ...(!isSolved && {
            "&:hover": {
                filter: isLocked ? "none" : "brightness(1.08)"
            },
            "&:focus-visible": {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: -2,
                zIndex: 2,
                position: "relative" as const
            }
        })
    }),

    // Invalid drop feedback
    ...(isInvalidDrop && {
        backgroundColor: `${theme.game.invalidDropColor} !important`,
        boxShadow: `inset 0 0 0 2px ${theme.game.invalidDropBorderColor} !important`,
        animation: `${invalidDropShake} 0.5s ease-in-out`,
        animationDelay: "0s",
        zIndex: 10,
        position: "relative" as const
    }),

    // Keyboard cursor outline (keyboard-drag anchor)
    ...(isKeyboardCursor && !isHidden && {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: -2,
        zIndex: 4,
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
