import { useState } from "react";
import type { Piece } from "../../common/types";

const placementKey = (piece: Piece): string | null =>
    piece.position
        ? `${piece.position.x},${piece.position.y},${piece.rotation},${piece.isFlippedH},${piece.isFlippedV}`
        : null;

/**
 * Returns the id of the one piece that was just placed or moved on the board,
 * or null. Bulk changes (solution reveal, reset, loading a saved session)
 * change several pieces at once and return null, so only a single placement
 * plays the landing animation.
 */
export const findLandedPiece = (prev: Piece[], next: Piece[]): number | null => {
    const landed = next.filter(piece => {
        const key = placementKey(piece);
        if (key === null) {
            return false;
        }
        const before = prev.find(p => p.id === piece.id);
        return !before || placementKey(before) !== key;
    });
    return landed.length === 1 ? landed[0].id : null;
};

/**
 * Drives the board's two one-shot animations.
 *
 * - `landingPieceId`: the piece whose cells play the landing animation.
 * - `celebrating`: true from the moment the board becomes solved in this
 *   mount. A board that loads already solved does not celebrate.
 *
 * Both values stay set after their animation ends. The cells keep the
 * finished animation in their `animation` list, which is harmless, and the
 * next change replaces it.
 */
export function useBoardAnimations(pieces: Piece[], isSolved: boolean) {
    const [prevPieces, setPrevPieces] = useState(pieces);
    const [landingPieceId, setLandingPieceId] = useState<number | null>(null);
    const [prevSolved, setPrevSolved] = useState(isSolved);
    const [celebrating, setCelebrating] = useState(false);

    // Adjust state during render when a prop changes (React's documented
    // alternative to an effect), so the first paint of the new placement
    // already carries the animation.
    if (pieces !== prevPieces) {
        setPrevPieces(pieces);
        setLandingPieceId(findLandedPiece(prevPieces, pieces));
    }
    if (isSolved !== prevSolved) {
        setPrevSolved(isSolved);
        setCelebrating(isSolved);
    }

    return { landingPieceId, celebrating };
}
