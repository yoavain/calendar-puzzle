import React from "react";
import { styled } from "@mui/material/styles";
import type { PieceId } from "../../../common/pieceData";
import { PIECE_DATA } from "../../../common/pieceData";
import { getPieceColor } from "../../utils/pieceColors";

const CELL_SIZE = 50;
const DEPTH = 12;

interface PiecePlacement {
    id: PieceId;
    x: number;
    y: number;
    rotation: number;
}

/**
 * Hand-tuned positions to scatter pieces around the board,
 * inspired by the concept image layout.
 * Coordinates are relative to the scene center.
 */
const PIECE_PLACEMENTS: PiecePlacement[] = [
    { id: 2, x: -310, y: -120, rotation: 12 }, // Teal — upper left
    { id: 1, x: -290, y: 100, rotation: -20 }, // Coral — left
    { id: 3, x: -200, y: 280, rotation: -10 }, // Chocolate — lower left
    { id: 6, x: -20, y: 310, rotation: 6 }, // Marigold — bottom center-left
    { id: 4, x: 120, y: 330, rotation: -15 }, // Violet — bottom center
    { id: 7, x: 230, y: 260, rotation: 18 }, // Olive — bottom right
    { id: 5, x: 310, y: -80, rotation: -8 }, // Rose — right upper
    { id: 8, x: 320, y: 120, rotation: 14 } // Royal blue — right
];

/**
 * Darken a hex color by a factor (0 = no change, 1 = black).
 */
function darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * (1 - factor))}, ${Math.round(g * (1 - factor))}, ${Math.round(b * (1 - factor))})`;
}

/**
 * Generate a box-shadow string that simulates extrusion depth.
 */
function extrusionShadow(color: string, depth: number): string {
    const dark = darkenColor(color, 0.45);
    const layers = [];
    for (let i = 1; i <= depth; i++) {
        layers.push(`${i}px ${i}px 0 ${dark}`);
    }
    return layers.join(", ");
}

const PieceWrapper = styled("div")({
    position: "absolute",
    transformStyle: "preserve-3d"
});

const PieceGrid = styled("div")({
    display: "flex",
    flexDirection: "column",
    gap: 0
});

const PieceRow = styled("div")({
    display: "flex",
    gap: 0
});

interface PieceCellProps {
    filled: boolean;
    color: string;
    shadow: string;
}

const PieceCell = styled("div", {
    shouldForwardProp: (prop) => !["filled", "color", "shadow"].includes(prop as string)
})<PieceCellProps>(({ filled, color, shadow }) => ({
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: filled ? color : "transparent",
    backgroundImage: filled
        ? "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 40%, transparent 50%, rgba(0,0,0,0.08) 100%)"
        : "none",
    visibility: filled ? "visible" : "hidden",
    boxShadow: filled ? shadow : "none"
}));

/**
 * Renders all 8 pieces scattered around the board with 3D extruded depth.
 * Pieces are positioned absolutely within the scene.
 */
export const StaticPieces: React.FC = () => {
    return (
        <>
            {PIECE_PLACEMENTS.map(({ id, x, y, rotation }) => {
                const shape = PIECE_DATA[id].shape;
                const color = getPieceColor(id);
                const shadow = extrusionShadow(color, DEPTH);

                return (
                    <PieceWrapper
                        key={id}
                        style={{
                            top: "50%",
                            left: "50%",
                            transform: `translate(-50%, -55%) translate(${x}px, ${y}px) rotate(${rotation}deg)`
                        }}
                    >
                        <PieceGrid>
                            {shape.map((row, rowIdx) => (
                                <PieceRow key={rowIdx}>
                                    {row.map((filled, colIdx) => (
                                        <PieceCell
                                            key={`${rowIdx}-${colIdx}`}
                                            filled={filled}
                                            color={color}
                                            shadow={shadow}
                                        />
                                    ))}
                                </PieceRow>
                            ))}
                        </PieceGrid>
                    </PieceWrapper>
                );
            })}
        </>
    );
};
