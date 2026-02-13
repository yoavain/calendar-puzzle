/**
 * UI color definitions for puzzle pieces.
 *
 * This module contains visual/presentation data (colors) separate from
 * the game logic. Colors belong in the client layer, not in common.
 */

import type { PieceId } from "../../common/pieceData";

/**
 * Color mapping for all puzzle pieces.
 * Each piece has a unique color for visual distinction.
 */
export const PIECE_COLORS: Record<PieceId, string> = {
    1: "#E07A5F", // Coral
    2: "#3D9970", // Teal
    3: "#6B4423", // Chocolate
    4: "#8B5CF6", // Violet
    5: "#DB5B80", // Rose
    6: "#E8AA14", // Marigold
    7: "#8DA547", // Olive
    8: "#4169E1" // Royal blue
};

/**
 * Get the color for a piece by ID.
 *
 * @param id - Piece ID (1-8)
 * @returns The hex color string
 */
export const getPieceColor = (id: number): string =>
    PIECE_COLORS[id as PieceId];
