import { useCallback, useEffect, useRef, useState } from "react";
import type { PuzzleDate } from "../../../common/types";
import { toPuzzleDate } from "../../../common/types";
import { findLastUnsolvedDate } from "../../../common/streakUtils";
import type { User } from "../../context/UserContext";
import type { UserSettings } from "../../../common/restTypes";

/** What a solve shows in the stats dialog. Without a next date, every date is solved. */
export interface SolveResult {
    solvedDate: PuzzleDate;
    nextDate: PuzzleDate | null;
}

const isSameDate = (a: PuzzleDate, b: PuzzleDate) => a.month === b.month && a.day === b.day;

/**
 * Manages all modal open/close state and what follows a solve.
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
    // Kept after the dialog closes, so its title and buttons don't change while it fades out.
    const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
    const [isSolvedNoticeRequested, setIsSolvedNoticeRequested] = useState(false);
    const [solvedNoticeNextDate, setSolvedNoticeNextDate] = useState<PuzzleDate | null>(null);
    const [isYearCompleteOpen, setIsYearCompleteOpen] = useState(false);
    const [isTokenConfirmOpen, setIsTokenConfirmOpen] = useState(false);

    const pendingSolveRef = useRef<PuzzleDate | null>(null);
    const hasCheckedTodayRef = useRef(false);
    const statsAutoOpenTimeoutRef = useRef<number | null>(null);

    // The stats timer outlives several renders, so it reads the latest dates from here.
    const completedDatesRef = useRef(completedDates);
    completedDatesRef.current = completedDates;

    const noteSolve = useCallback((solvedDate: PuzzleDate) => {
        pendingSolveRef.current = solvedDate;
        setIsSolvedNoticeRequested(false);
        // The solve reaches completedDates soon after, and must not read as "already solved".
        if (isSameDate(solvedDate, toPuzzleDate(new Date()))) {
            hasCheckedTodayRef.current = true;
        }
    }, []);

    const openStatsAfterSolve = useCallback(() => {
        const solvedDate = pendingSolveRef.current;
        pendingSolveRef.current = null;
        if (solvedDate) {
            setSolveResult({
                solvedDate,
                nextDate: findLastUnsolvedDate([...completedDatesRef.current, solvedDate], solvedDate)
            });
        }
        setIsStatsOpen(true);
    }, []);

    // Clear the auto-open timer on unmount to avoid setState on an unmounted component
    useEffect(() => () => {
        if (statsAutoOpenTimeoutRef.current !== null) {
            window.clearTimeout(statsAutoOpenTimeoutRef.current);
        }
    }, []);

    // On page load or after login, say so if today is already solved.
    useEffect(() => {
        if (!userLoading && user && !hasCheckedTodayRef.current) {
            const today = toPuzzleDate(new Date());
            if (completedDates.some(d => isSameDate(d, today))) {
                hasCheckedTodayRef.current = true;
                const nextDate = findLastUnsolvedDate(completedDates, today);
                if (nextDate) {
                    setSolvedNoticeNextDate(nextDate);
                    setIsSolvedNoticeRequested(true);
                }
                else {
                    // Every date is solved. This is deliberately not remembered between visits.
                    setIsYearCompleteOpen(true);
                }
            }
        }
    }, [userLoading, user, completedDates]);

    // The notice is about the date the player just left, so it closes with a date change.
    // The game history copies the date on every move, so this compares the values.
    const noticeDateRef = useRef(currentDate);
    useEffect(() => {
        if (!isSameDate(noticeDateRef.current, currentDate)) {
            setIsSolvedNoticeRequested(false);
        }
        noticeDateRef.current = currentDate;
    }, [currentDate]);

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
        || isYearCompleteOpen || isTokenConfirmOpen;
    const isTokenIntroOpen = isTokenIntroRequested && !isAnyOtherModalOpen;

    const closeTokenIntro = useCallback(() => {
        setIsTokenIntroRequested(false);
        if (!settings.tokenIntroSeen) {
            onTokenIntroSeen();
        }
    }, [settings.tokenIntroSeen, onTokenIntroSeen]);

    return {
        // Refs and setters needed by handlers in useGameController
        noteSolve,
        openStatsAfterSolve,
        statsAutoOpenTimeoutRef,
        setIsStatsOpen,
        setIsSolvedNoticeRequested,
        setIsYearCompleteOpen,
        setIsTokenConfirmOpen,

        // Structured modal state consumed by layouts
        modals: {
            stats: {
                isOpen: isStatsOpen,
                solveResult,
                open: () => {
                    setSolveResult(null);
                    setIsStatsOpen(true);
                },
                close: () => {
                    setIsStatsOpen(false);
                    if (solveResult && !solveResult.nextDate) {
                        setIsYearCompleteOpen(true);
                    }
                }
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
            solvedNotice: {
                // It waits for any dialog, so its time doesn't run out unseen behind one.
                isOpen: isSolvedNoticeRequested && !isAnyOtherModalOpen && !isTokenIntroOpen,
                nextDate: solvedNoticeNextDate,
                close: () => setIsSolvedNoticeRequested(false)
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
                isOpen: isTokenIntroOpen,
                isFirstView: !settings.tokenIntroSeen,
                open: () => setIsTokenIntroRequested(true),
                close: closeTokenIntro
            }
        }
    };
}
