import { useCallback, useEffect, useRef, useState } from "react";
import type { PuzzleDate } from "../../../common/types";
import { toPuzzleDate } from "../../../common/types";
import { findLastUnsolvedDate } from "../../../common/streakUtils";
import type { User } from "../../context/UserContext";
import type { UserSettings } from "../../../common/restTypes";

/**
 * Manages all modal open/close state and the play-another dialog flow.
 */
export function useGameModals({
    user,
    userLoading,
    completedDates,
    currentDate,
    settings,
    onTokenIntroSeen
}: {
    user: User | null;
    userLoading: boolean;
    completedDates: PuzzleDate[];
    currentDate: PuzzleDate;
    settings: UserSettings;
    onTokenIntroSeen: () => void;
}) {
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isPlayAnotherOpen, setIsPlayAnotherOpen] = useState(false);
    const [playAnotherDate, setPlayAnotherDate] = useState<PuzzleDate | null>(null);
    const [playAnotherMode, setPlayAnotherMode] = useState<"just-solved" | "already-solved">("already-solved");
    const [isYearCompleteOpen, setIsYearCompleteOpen] = useState(false);
    const [isTokenConfirmOpen, setIsTokenConfirmOpen] = useState(false);

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
        else {
            // Nothing left to suggest — every date is solved. The year-complete
            // screen replaces the play-another prompt from here on, in both
            // modes, and is deliberately not remembered between visits.
            setIsYearCompleteOpen(true);
        }
    }, [completedDates]);

    // Clear the auto-open timer on unmount to avoid setState on an unmounted component
    useEffect(() => () => {
        if (statsAutoOpenTimeoutRef.current !== null) {
            window.clearTimeout(statsAutoOpenTimeoutRef.current);
        }
    }, []);

    // Trigger 1: after stats dialog is closed following a solve, show "play another".
    // It fires on the open -> closed transition only. The effect also re-runs when
    // currentDate or completedDates change identity (the game history copies the
    // date on every move), and those re-runs must not count as a close.
    const wasStatsOpenRef = useRef(false);
    useEffect(() => {
        const statsJustClosed = wasStatsOpenRef.current && !isStatsOpen;
        wasStatsOpenRef.current = isStatsOpen;
        if (statsJustClosed && justSolvedRef.current && user) {
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

    // The intro is "requested" once per session for a user who has not seen it,
    // and shown only while no other dialog is open, so it never stacks.
    const [isTokenIntroRequested, setIsTokenIntroRequested] = useState(false);
    const hasRequestedTokenIntroRef = useRef(false);

    useEffect(() => {
        if (!userLoading && user && !settings.tokenIntroSeen && !hasRequestedTokenIntroRef.current) {
            hasRequestedTokenIntroRef.current = true;
            setIsTokenIntroRequested(true);
        }
    }, [userLoading, user, settings.tokenIntroSeen]);

    const isAnyOtherModalOpen = isStatsOpen || isIssueModalOpen || isHelpModalOpen || isShareOpen
        || isPlayAnotherOpen || isYearCompleteOpen || isTokenConfirmOpen;

    const closeTokenIntro = useCallback(() => {
        setIsTokenIntroRequested(false);
        if (!settings.tokenIntroSeen) {
            onTokenIntroSeen();
        }
    }, [settings.tokenIntroSeen, onTokenIntroSeen]);

    return {
        // Refs and setters needed by handlers in useGameController
        justSolvedRef,
        statsAutoOpenTimeoutRef,
        setIsStatsOpen,
        setIsPlayAnotherOpen,
        setIsYearCompleteOpen,
        setIsTokenConfirmOpen,

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
            },
            share: {
                isOpen: isShareOpen,
                open: () => setIsShareOpen(true),
                close: () => setIsShareOpen(false)
            },
            yearComplete: {
                isOpen: isYearCompleteOpen,
                open: () => setIsYearCompleteOpen(true),
                close: () => setIsYearCompleteOpen(false)
            },
            tokenConfirm: {
                isOpen: isTokenConfirmOpen,
                open: () => setIsTokenConfirmOpen(true),
                close: () => setIsTokenConfirmOpen(false)
            },
            tokenIntro: {
                isOpen: isTokenIntroRequested && !isAnyOtherModalOpen,
                open: () => setIsTokenIntroRequested(true),
                close: closeTokenIntro
            }
        }
    };
}
