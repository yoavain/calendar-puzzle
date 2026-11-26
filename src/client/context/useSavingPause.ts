/**
 * "Saving is paused": the database does not answer. Enters and leaves that state, sends the
 * pending saves, and chooses the notice for the player.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PuzzleDate } from "../../common/types";
import type { SavingNoticeKind } from "../copy/savingCopy";
import { flushPendingSaves } from "../service/pendingSaves.js";
import { getDatabaseStatus, SERVER_FAILURE_EVENT } from "../service/serverStatus.js";
import { logToServer } from "../service/logService.js";

const RECOVERY_POLL_MS = 30_000;
// The health answer is cached for 10 s, so a first "ok" can be out of date.
const RECHECK_MS = 11_000;

export function useSavingPause({ userId, loading, refreshUser, addPlayedDate, addCompletedDate }: {
    userId: string | null;
    loading: boolean;
    /** Reads the account data again. It sets the paused state from the answer. */
    refreshUser: () => Promise<void>;
    addPlayedDate: (date: PuzzleDate) => void;
    addCompletedDate: (date: PuzzleDate) => void;
}) {
    const [paused, setPaused] = useState(false);
    const [notice, setNotice] = useState<SavingNoticeKind | null>(null);
    // Solves sent late. They must not read as "already solved" when the account data returns.
    const [sentSolves, setSentSolves] = useState<PuzzleDate[]>([]);

    const savingPaused = paused && userId !== null;
    const wasPausedRef = useRef(false);

    const dismissSavingNotice = useCallback(() => setNotice(null), []);

    // A failed API call may mean that the database is gone. Health decides.
    useEffect(() => {
        if (userId === null || savingPaused) {
            return;
        }
        let isActive = true;
        let isChecking = false;
        let recheckTimer: number | undefined;

        const check = async (mayRecheck: boolean) => {
            const status = await getDatabaseStatus();
            if (!isActive) {
                return;
            }
            if (status === "down") {
                setPaused(true);
            }
            else if (status === "ok" && mayRecheck) {
                recheckTimer = window.setTimeout(() => {
                    check(false).catch(() => {});
                }, RECHECK_MS);
                return;
            }
            isChecking = false;
        };

        const handleFailure = () => {
            if (!isChecking) {
                isChecking = true;
                check(true).catch(() => {});
            }
        };

        window.addEventListener(SERVER_FAILURE_EVENT, handleFailure);
        return () => {
            isActive = false;
            window.clearTimeout(recheckTimer);
            window.removeEventListener(SERVER_FAILURE_EVENT, handleFailure);
        };
    }, [userId, savingPaused]);

    // While paused, ask for the database until it answers.
    useEffect(() => {
        if (!savingPaused) {
            return;
        }
        wasPausedRef.current = true;
        // A solve that just failed is often what reveals the outage. Its notice says more, so it stays.
        setNotice(current => (current === "solved-paused" ? current : "paused"));

        const check = async () => {
            if (await getDatabaseStatus() === "ok") {
                await refreshUser();
            }
        };
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                check().catch(() => {});
            }
        };

        const interval = window.setInterval(() => {
            check().catch(() => {});
        }, RECOVERY_POLL_MS);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [savingPaused, refreshUser]);

    // Send what is pending: on a visit, on recovery, and when the browser is back online.
    useEffect(() => {
        if (userId === null || loading || paused) {
            return;
        }

        const flush = async () => {
            const { started, solved, tokensGranted } = await flushPendingSaves(userId);
            started.forEach(addPlayedDate);
            solved.forEach(addCompletedDate);
            if (solved.length > 0) {
                setSentSolves(previous => [...previous, ...solved]);
            }
            if (started.length > 0 || solved.length > 0) {
                // The token balance comes from the server
                await refreshUser();
            }
            if (wasPausedRef.current) {
                wasPausedRef.current = false;
                // Only a first solve grants a token, so only then is the solve news
                setNotice(tokensGranted > 0 ? "back-saved" : "back");
            }
        };
        const handleOnline = () => {
            flush().catch((error) => logToServer("error", "Saving: Failed to send pending saves", error));
        };

        handleOnline();
        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, [userId, loading, paused, refreshUser, addPlayedDate, addCompletedDate]);

    return { savingPaused, setPaused, sentSolves, notice, showSavingNotice: setNotice, dismissSavingNotice };
}
