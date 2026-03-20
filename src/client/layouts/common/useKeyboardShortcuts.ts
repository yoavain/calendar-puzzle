import { useCallback, useEffect, useRef } from "react";

/**
 * Registers global keyboard shortcuts:
 * - Ctrl/Cmd+Z: undo
 * - Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y: redo
 * - Escape: reset (when reset is not disabled)
 *
 * handleReset and isResetDisabled are read via refs so that the listener
 * is not re-subscribed on every piece placement.
 */
export function useKeyboardShortcuts({
    canUndo,
    canRedo,
    undo,
    redo,
    handleReset,
    isResetDisabled
}: {
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    handleReset: () => void;
    isResetDisabled: boolean;
}) {
    const handleResetRef = useRef(handleReset);
    handleResetRef.current = handleReset;
    const isResetDisabledRef = useRef(isResetDisabled);
    isResetDisabledRef.current = isResetDisabled;

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
        }
        // Alternative: Ctrl+Y for redo (common on Windows)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            if (canRedo) {
                redo();
            }
        }
        // Escape to reset — read via ref to avoid re-subscribing the listener on every piece move
        if (e.key === "Escape" && !isResetDisabledRef.current) {
            e.preventDefault();
            handleResetRef.current();
        }
    }, [canUndo, canRedo, undo, redo]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);
}
