import { useCallback } from "react";
import type { Position } from "../../../common/types";
import type { PieceId } from "../../../common/pieceData";
import type { GameController } from "./useGameController";

/**
 * Shared DnD adapter callbacks for mobile layouts.
 * Bridges @dnd-kit events to the game controller.
 */
export function useDndAdapters(game: GameController) {
    const handleDndPieceDrop = useCallback((position: Position, pieceId: PieceId) => {
        game.handlePieceDrop(position, { pieceId });
    }, [game]);

    const handleDndPieceRemove = useCallback((pieceId: PieceId) => {
        game.handlePieceReturnToPile(pieceId);
    }, [game]);

    const handleDndDragStart = useCallback((pieceId: number) => {
        game.setDraggedPieceId(pieceId);
    }, [game]);

    const handleDndDragEnd = useCallback(() => {
        game.setDraggedPieceId(null);
    }, [game]);

    return { handleDndPieceDrop, handleDndPieceRemove, handleDndDragStart, handleDndDragEnd };
}
