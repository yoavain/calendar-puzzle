import type { Piece } from "../../common/types";

/**
 * Transition for a piece's rotate and flip. The piece in the carousel and its thumbnail
 * both use it, so they turn together.
 */
export const PIECE_TRANSFORM_TRANSITION = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * CSS transform that draws a piece's base shape in its current orientation.
 *
 * CSS applies transforms right to left, so this lists them in reverse to match
 * `getTransformedShape`, which applies rotation, then the horizontal flip, then the vertical flip.
 * All three are always present, so the transform keeps the same structure and can animate.
 *
 * @param cumulativeRotation - Angle from `useCumulativeRotation`, in degrees.
 */
export const buildPieceTransform = (
    piece: Pick<Piece, "isFlippedH" | "isFlippedV">,
    cumulativeRotation: number
): string => [
    `scaleY(${piece.isFlippedV ? -1 : 1})`,
    `scaleX(${piece.isFlippedH ? -1 : 1})`,
    `rotate(${cumulativeRotation}deg)`
].join(" ");
