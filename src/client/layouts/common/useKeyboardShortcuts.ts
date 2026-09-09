import { useEffect, useEffectEvent } from "react";
import type { PieceId } from "../../../common/pieceData";

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
};

/**
 * Registers global keyboard shortcuts:
 * - Ctrl/Cmd+Z: undo
 * - Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y: redo
 * - Escape: clear selection if a pool piece is selected, else reset
 * - R / Shift+R: rotate the selected pool piece CW / CCW
 * - F / Shift+F: flip the selected pool piece horizontally / vertically
 *
 * The handler is a useEffectEvent, so it always sees the latest props while
 * staying non-reactive. The listener subscribes once and is never re-subscribed
 * on a piece placement.
 */
export function useKeyboardShortcuts({
    canUndo,
    canRedo,
    undo,
    redo,
    handleReset,
    isResetDisabled,
    selectablePieceId,
    onRotateCW,
    onRotateCCW,
    onFlipH,
    onFlipV,
    onClearSelection
}: {
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    handleReset: () => void;
    isResetDisabled: boolean;
    /**
     * The currently-selected pool piece, if any. When set, R/F shortcuts act
     * on it and Esc clears the selection instead of resetting. `null` when
     * either nothing is selected or the selected piece is already placed.
     */
    selectablePieceId?: PieceId | null;
    onRotateCW?: (pieceId: PieceId) => void;
    onRotateCCW?: (pieceId: PieceId) => void;
    onFlipH?: (pieceId: PieceId) => void;
    onFlipV?: (pieceId: PieceId) => void;
    onClearSelection?: () => void;
}) {
    const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            e.preventDefault();
            if (e.shiftKey) {
                if (canRedo) {
                    redo();
                }
            }
            else {
                if (canUndo) {
                    undo();
                }
            }
            return;
        }
        // Alternative: Ctrl+Y for redo (common on Windows)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            if (canRedo) {
                redo();
            }
            return;
        }
        // Escape: clear selection first, else reset
        if (e.key === "Escape") {
            if (selectablePieceId !== null && selectablePieceId !== undefined) {
                e.preventDefault();
                onClearSelection?.();
                return;
            }
            if (!isResetDisabled) {
                e.preventDefault();
                handleReset();
            }
            return;
        }
        // Single-letter shortcuts: skip if the user is typing into a form field
        // or holding a modifier we don't handle.
        if (e.ctrlKey || e.metaKey || e.altKey || isEditableTarget(e.target)) {
            return;
        }
        const selectedId = selectablePieceId;
        if (selectedId === null || selectedId === undefined) {
            return;
        }
        const key = e.key.toLowerCase();
        if (key === "r") {
            e.preventDefault();
            if (e.shiftKey) {
                onRotateCCW?.(selectedId);
            }
            else {
                onRotateCW?.(selectedId);
            }
            return;
        }
        if (key === "f") {
            e.preventDefault();
            if (e.shiftKey) {
                onFlipV?.(selectedId);
            }
            else {
                onFlipH?.(selectedId);
            }
        }
    });

    useEffect(() => {
        // The effect event is called from inside the Effect rather than handed to
        // the DOM directly, and it never changes identity, so this subscribes once.
        const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
}
