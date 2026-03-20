import { useCallback, useEffect, useRef, useState } from "react";
import type { PuzzleDate } from "../../../common/types";
import { toPuzzleDate } from "../../../common/types";
import { findLastUnsolvedDate } from "../../../common/streakUtils";
import type { User } from "../../context/UserContext";

/**
 * Manages all modal open/close state and the play-another dialog flow.
 */
export function useGameModals({
    user,
    userLoading,
    completedDates,
    currentDate
}: {
    user: User | null;
    userLoading: boolean;
    completedDates: PuzzleDate[];
    currentDate: PuzzleDate;
}) {
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isPlayAnotherOpen, setIsPlayAnotherOpen] = useState(false);
    const [playAnotherDate, setPlayAnotherDate] = useState<PuzzleDate | null>(null);
    const [playAnotherMode, setPlayAnotherMode] = useState<"just-solved" | "already-solved">("already-solved");

    // Refs for play-another dialog flow control
    const justSolvedRef = useRef(false);
    const hasShownPlayAnotherRef = useRef(false);
    const statsAutoOpenTimeoutRef = useRef<number | null>(null);

    const checkAndSuggestNextPuzzle = useCallback((solvedDate: PuzzleDate, mode: "just-solved" | "already-solved") => {
        const suggested = findLastUnsolvedDate(
            [...completedDates, solvedDate],
            solvedDate
        );
        if (suggested) {
            setPlayAnotherDate(suggested);
            setPlayAnotherMode(mode);
            setIsPlayAnotherOpen(true);
        }
    }, [completedDates]);

    // Clear the auto-open timer on unmount to avoid setState on an unmounted component
    useEffect(() => () => {
        if (statsAutoOpenTimeoutRef.current !== null) {
            window.clearTimeout(statsAutoOpenTimeoutRef.current);
        }
    }, []);

    // Trigger 1: after stats dialog is closed following a solve, show "play another"
    useEffect(() => {
        if (!isStatsOpen && justSolvedRef.current && user) {
            if (statsAutoOpenTimeoutRef.current !== null) {
                window.clearTimeout(statsAutoOpenTimeoutRef.current);
                statsAutoOpenTimeoutRef.current = null;
            }
            justSolvedRef.current = false;
            checkAndSuggestNextPuzzle(currentDate, "just-solved");
        }
    }, [isStatsOpen, user, checkAndSuggestNextPuzzle, currentDate]);

    // Trigger 2+3: on page load or after login, suggest a puzzle if today is already solved
    useEffect(() => {
        if (!userLoading && user && !hasShownPlayAnotherRef.current) {
            const today = toPuzzleDate(new Date());
            const todayAlreadySolved = completedDates.some(
                d => d.month === today.month && d.day === today.day
            );
            if (todayAlreadySolved) {
                hasShownPlayAnotherRef.current = true;
                checkAndSuggestNextPuzzle(today, "already-solved");
            }
        }
    }, [userLoading, user, completedDates, checkAndSuggestNextPuzzle]);

    return {
        // Refs and setters needed by handlers in useGameController
        justSolvedRef,
        statsAutoOpenTimeoutRef,
        setIsStatsOpen,
        setIsPlayAnotherOpen,

        // Structured modal state consumed by layouts
        modals: {
            stats: {
                isOpen: isStatsOpen,
                open: () => setIsStatsOpen(true),
                close: () => setIsStatsOpen(false)
            },
            issue: {
                isOpen: isIssueModalOpen,
                open: () => setIsIssueModalOpen(true),
                close: () => setIsIssueModalOpen(false)
            },
            help: {
                isOpen: isHelpModalOpen,
                open: () => setIsHelpModalOpen(true),
                close: () => setIsHelpModalOpen(false)
            },
            playAnother: {
                isOpen: isPlayAnotherOpen,
                suggestedDate: playAnotherDate,
                mode: playAnotherMode,
                open: () => setIsPlayAnotherOpen(true),
                close: () => setIsPlayAnotherOpen(false)
            }
        }
    };
}
