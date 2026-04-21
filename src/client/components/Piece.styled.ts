import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { keyframes } from "@emotion/react";
import { getPieceColor, PIECE_CELL_GRADIENT } from "../utils/pieceColors";

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

// Piece wrapper props
export interface PieceWrapperProps {
    isPlaced?: boolean;
}

// Piece wrapper (the outer container for a piece in the pool)
export const PieceWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isPlaced"
})<PieceWrapperProps>(({ theme, isPlaced }) => ({
    cursor: isPlaced ? "move" : "grab",
    border: "none",
    margin: 0,
    padding: 0,
    transition: "box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1), outline 0.2s ease, outline-offset 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: isPlaced ? "auto" : "100%",
    height: isPlaced ? "auto" : `calc(100% - ${theme.game.cellSizePx})`,
    minHeight: isPlaced ? "auto" : `calc(${theme.game.cellSizePx} * 4)`,
    borderRadius: theme.game.radius.sm,

    // Placed state
    ...(isPlaced && {
        cursor: "move",
        opacity: 1,
        animation: `${pieceDropIn} 0.35s cubic-bezier(0.4,0,0.2,1)`,
        
        "&:hover": {
            opacity: 1,
            boxShadow: `0 0 5px ${theme.palette.primary.main}`
        }
    }),

    // Hover effect for non-placed pieces
    ...(!isPlaced && {
        "&:hover": {
            cursor: "grab",
            boxShadow: "0 4px 16px rgba(0,123,255,0.18), 0 2px 8px rgba(0,0,0,0.14)",
            transform: "translateY(-2px) scale(1.04)",
            zIndex: 3
        },
        "&:active": {
            cursor: "grabbing"
        }
    })
}));

// Piece grid props
export interface PieceGridProps {
    columns: number;
    rows: number;
    transformStyle: string;
    /** Optional override for cell size (e.g. to match scaled board in carousel). */
    cellSizePx?: string;
}

// Piece grid (the grid that contains piece cells)
export const PieceGrid = styled("div", {
    shouldForwardProp: (prop) => prop !== "cellSizePx"
})<PieceGridProps>(({ theme, columns, rows, transformStyle, cellSizePx }) => {
    const size = cellSizePx ?? theme.game.cellSizePx;
    return {
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, ${size})`,
        gridTemplateRows: `repeat(${rows}, ${size})`,
        gap: 0,
        backgroundColor: "transparent",
        cursor: "grab",
        border: "none",
        margin: 0,
        padding: 0,
        transform: transformStyle,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, filter 0.25s ease",
        borderRadius: theme.game.radius.sm,
        // Prevent sub-pixel gaps between cells during transforms
        backfaceVisibility: "hidden",
        // Default shadow for depth perception
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 1px 2px rgba(0,0,0,0.1))",

        "&:active": {
            cursor: "grabbing"
        },

        "&:hover": {
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2)) drop-shadow(0 2px 4px rgba(0,0,0,0.12))"
        }
    };
});

// Piece cell props
export interface PieceCellProps {
    isFilled?: boolean;
    pieceId?: number;
    /** Optional override for cell size (e.g. to match scaled board in carousel). */
    cellSizePx?: string;
}

// Piece cell (individual cells within a piece)
export const PieceCell = styled("div", {
    shouldForwardProp: (prop) => prop !== "cellSizePx"
})<PieceCellProps>(({ theme, isFilled, pieceId, cellSizePx }) => {
    const size = cellSizePx ?? theme.game.cellSizePx;
    return {
        width: size,
        height: size,
        border: "none",
        outline: "none",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        display: "block",
        transition: "background-color 0.2s ease",

        // Empty cell styling
        ...(!isFilled && {
            backgroundColor: "transparent",
            visibility: "hidden"
        }),

        // Filled cell styling - use box-shadow to fill gaps during transforms
        ...(isFilled && {
            backgroundColor: pieceId ? getPieceColor(pieceId) : getPieceColor(1),
            color: "#ffffff",
            // Prevent sub-pixel gaps by extending color with box-shadow
            boxShadow: `inset 0 0 0 1px ${pieceId ? getPieceColor(pieceId) : getPieceColor(1)}`,
            backgroundImage: PIECE_CELL_GRADIENT
        })
    };
});
