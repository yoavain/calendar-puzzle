import { useCallback, useEffect, useRef } from "react";
import type { PieceId } from "../../../common/pieceData";

/**
 * Registers global keyboard shortcuts:
 * - Ctrl/Cmd+Z: undo
 * - Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y: redo
 * - Escape: clear selection if a pool piece is selected, else reset
 * - R / Shift+R: rotate the selected pool piece CW / CCW
 * - F / Shift+F: flip the selected pool piece horizontally / vertically
 *
 * Non-primitive values are read via refs so that the listener is not
 * re-subscribed on every piece placement.
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
    const handleResetRef = useRef(handleReset);
    handleResetRef.current = handleReset;
    const isResetDisabledRef = useRef(isResetDisabled);
    isResetDisabledRef.current = isResetDisabled;
    const selectablePieceIdRef = useRef(selectablePieceId);
    selectablePieceIdRef.current = selectablePieceId;
    const onRotateCWRef = useRef(onRotateCW);
    onRotateCWRef.current = onRotateCW;
    const onRotateCCWRef = useRef(onRotateCCW);
    onRotateCCWRef.current = onRotateCCW;
    const onFlipHRef = useRef(onFlipH);
    onFlipHRef.current = onFlipH;
    const onFlipVRef = useRef(onFlipV);
    onFlipVRef.current = onFlipV;
    const onClearSelectionRef = useRef(onClearSelection);
    onClearSelectionRef.current = onClearSelection;

    const isEditableTarget = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) {
            return false;
        }
        const tag = target.tagName;
        return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
            if (selectablePieceIdRef.current !== null && selectablePieceIdRef.current !== undefined) {
                e.preventDefault();
                onClearSelectionRef.current?.();
                return;
            }
            if (!isResetDisabledRef.current) {
                e.preventDefault();
                handleResetRef.current();
            }
            return;
        }
        // Single-letter shortcuts: skip if the user is typing into a form field
        // or holding a modifier we don't handle.
        if (e.ctrlKey || e.metaKey || e.altKey || isEditableTarget(e.target)) {
            return;
        }
        const selectedId = selectablePieceIdRef.current;
        if (selectedId === null || selectedId === undefined) {
            return;
        }
        const key = e.key.toLowerCase();
        if (key === "r") {
            e.preventDefault();
            if (e.shiftKey) {
                onRotateCCWRef.current?.(selectedId);
            }
            else {
                onRotateCWRef.current?.(selectedId);
            }
            return;
        }
        if (key === "f") {
            e.preventDefault();
            if (e.shiftKey) {
                onFlipVRef.current?.(selectedId);
            }
            else {
                onFlipHRef.current?.(selectedId);
            }
        }
    }, [canUndo, canRedo, undo, redo]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);
}
