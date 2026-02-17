import React from "react";
import { styled } from "@mui/material/styles";
import { PIECE_DATA, PIECE_IDS } from "../../../common/pieceData";
import { getPieceColor } from "../../utils/pieceColors";

const CELL_SIZE = 28;
const DEPTH = 8;

const PiecesContainer = styled("div")({
    display: "grid",
    gridTemplateColumns: "repeat(4, auto)",
    gap: 20,
    justifyItems: "center",
    alignItems: "center"
});

const PieceGrid = styled("div")({
    display: "flex",
    flexDirection: "column",
    gap: 0,
    transformStyle: "preserve-3d"
});

const PieceRow = styled("div")({
    display: "flex",
    gap: 0
});

interface PieceCellProps {
    filled: boolean;
    color: string;
}

const PieceCell = styled("div", {
    shouldForwardProp: (prop) => prop !== "filled" && prop !== "color"
})<PieceCellProps>(({ filled, color }) => ({
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: "relative" as const,
    transformStyle: "preserve-3d",
    backgroundColor: filled ? color : "transparent",
    backgroundImage: filled
        ? "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)"
        : "none",
    visibility: filled ? "visible" : "hidden",
    // 3D depth extrusion via pseudo-element
    ...(filled && {
        "&::before": {
            content: "\"\"",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: darkenColor(color, 0.4),
            transform: `translateZ(-${DEPTH}px)`,
            // Hide pseudo-element behind the face
            zIndex: -1
        }
    })
}));

/**
 * Darken a hex color by a factor (0 = no change, 1 = black).
 */
function darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.round(r * (1 - factor));
    const dg = Math.round(g * (1 - factor));
    const db = Math.round(b * (1 - factor));
    return `rgb(${dr}, ${dg}, ${db})`;
}

/**
 * Static display of all 8 puzzle pieces in a 4x2 grid for the landing page.
 */
export const StaticPieces: React.FC = () => {
    return (
        <PiecesContainer>
            {PIECE_IDS.map((id) => {
                const shape = PIECE_DATA[id].shape;
                const color = getPieceColor(id);
                return (
                    <PieceGrid key={id}>
                        {shape.map((row, y) => (
                            <PieceRow key={y}>
                                {row.map((filled, x) => (
                                    <PieceCell
                                        key={`${y}-${x}`}
                                        filled={filled}
                                        color={color}
                                    />
                                ))}
                            </PieceRow>
                        ))}
                    </PieceGrid>
                );
            })}
        </PiecesContainer>
    );
};
