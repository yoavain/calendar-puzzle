import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleDate } from "../../common/types.js";
import type { AccountUser, MeResponse, UserSettings } from "../../common/restTypes.js";
import type { SavingNoticeKind } from "../copy/savingCopy";
import { useSavingPause } from "./useSavingPause";
import { clearCsrfToken, getCsrfToken } from "../service/csrfService";
import { logToServer } from "../service/logService.js";
import { saveUserSettings } from "../service/puzzleService.js";
import { API_AUTH_ME, AUTH_LOGOUT, SIGN_IN_ERROR } from "../../common/restPaths.js";

export type User = AccountUser;

interface UserContextValue {
    user: User | null;
    completedDates: PuzzleDate[];
    playedDates: PuzzleDate[];
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    addCompletedDate: (date: PuzzleDate) => void;
    addPlayedDate: (date: PuzzleDate) => void;
    tokenBalance: number;
    settings: UserSettings;
    setTokenBalance: (balance: number) => void;
    adjustTokenBalance: (delta: number) => void;
    updateSettings: (patch: UserSettings) => Promise<void>;
    /** The database does not answer: account features wait */
    savingPaused: boolean;
    sentSolves: PuzzleDate[];
    savingNotice: SavingNoticeKind | null;
    showSavingNotice: (notice: SavingNoticeKind) => void;
    dismissSavingNotice: () => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [completedDates, setCompletedDates] = useState<PuzzleDate[]>([]);
    const [playedDates, setPlayedDates] = useState<PuzzleDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [settings, setSettings] = useState<UserSettings>({});

    // The user whose account data is on screen
    const dataOwnerRef = useRef<string | null>(null);
    const isSignedInRef = useRef(false);
    // useSavingPause needs fetchUser, and fetchUser sets its state
    const setPausedRef = useRef<(paused: boolean) => void>(() => {});

    const clearAccountData = useCallback(() => {
        dataOwnerRef.current = null;
        setCompletedDates([]);
        setPlayedDates([]);
        setTokenBalance(0);
        setSettings({});
    }, []);

    const clearUser = useCallback(() => {
        isSignedInRef.current = false;
        setUser(null);
        clearAccountData();
        setPausedRef.current(false);
        clearCsrfToken();
    }, [clearAccountData]);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch(API_AUTH_ME, {
                credentials: "include"
            });
            // A signed-out answer is a 200. Any other status says nothing about the login.
            if (!res.ok) {
                if (!isSignedInRef.current) {
                    clearUser();
                }
                return;
            }
            const data = await res.json() as MeResponse;
            if (!data.user) {
                clearUser();
                return;
            }

            isSignedInRef.current = true;
            setUser(data.user);
            if (data.accountDataAvailable === false) {
                // Keep what is on screen, unless it belongs to someone else
                if (dataOwnerRef.current !== data.user.id) {
                    clearAccountData();
                }
                setPausedRef.current(true);
            }
            else {
                dataOwnerRef.current = data.user.id;
                setCompletedDates(data.completedDates || []);
                setPlayedDates(data.playedDates || []);
                setTokenBalance(data.tokenBalance ?? 0);
                setSettings(data.settings ?? {});
                setPausedRef.current(false);
            }

            // Fetch CSRF token separately after authenticated session is established
            getCsrfToken().catch(err => {
                logToServer("error", "UserContext: Failed to fetch CSRF token", err);
            });
        }
        catch (error) {
            logToServer("error", "UserContext: Failed to fetch user", error);
            if (!isSignedInRef.current) {
                clearUser();
            }
        }
        finally {
            setLoading(false);
        }
    }, [clearUser, clearAccountData]);

    useEffect(() => {
        fetchUser().catch(() => {});
    }, [fetchUser]);

    useEffect(() => {
        const handleUnauthorized = () => {
            clearUser();
        };

        window.addEventListener("app:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("app:unauthorized", handleUnauthorized);
    }, [clearUser]);

    // The back/forward cache can restore this page with the user from before the visitor left.
    // The visitor may have logged in or out since then, so ask the server again.
    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                fetchUser().catch(() => {});
            }
        };

        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, [fetchUser]);

    const logout = useCallback(async () => {
        const headers: Record<string, string> = {};
        try {
            const csrfToken = await getCsrfToken();
            if (csrfToken) {
                headers["X-CSRF-Token"] = csrfToken;
            }
        }
        catch (err) {
            logToServer("error", "UserContext: Failed to get CSRF token for logout", err);
        }

        try {
            await fetch(AUTH_LOGOUT, {
                method: "POST",
                headers,
                credentials: "include"
            });
        }
        catch (err) {
            logToServer("error", "UserContext: Logout request failed", err);
        }
        clearUser();
    }, [clearUser]);

    const addCompletedDate = useCallback((date: PuzzleDate) => {
        setCompletedDates(prev => {
            // Avoid duplicates
            if (prev.some(d => d.month === date.month && d.day === date.day)) {
                return prev;
            }
            return [...prev, date];
        });
    }, []);

    const addPlayedDate = useCallback((date: PuzzleDate) => {
        setPlayedDates(prev => {
            // Avoid duplicates
            if (prev.some(d => d.month === date.month && d.day === date.day)) {
                return prev;
            }
            return [...prev, date];
        });
    }, []);

    const adjustTokenBalance = useCallback((delta: number) => {
        setTokenBalance(prev => prev + delta);
    }, []);

    // Optimistic: the UI follows the choice at once; a failed save only logs,
    // and the next /me read shows the stored value.
    const updateSettings = useCallback(async (patch: UserSettings) => {
        setSettings(prev => ({ ...prev, ...patch }));
        try {
            await saveUserSettings(patch);
        }
        catch (error) {
            logToServer("error", "UserContext: Failed to save settings", error);
        }
    }, []);

    const { savingPaused, setPaused, sentSolves, notice: savingNotice, showSavingNotice, dismissSavingNotice } = useSavingPause({
        userId: user?.id ?? null,
        loading,
        refreshUser: fetchUser,
        addPlayedDate,
        addCompletedDate
    });
    setPausedRef.current = setPaused;

    // The server sends an incomplete Google sign-in back here. Only a server fault is news to the player.
    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get("error");
        if (code !== SIGN_IN_ERROR.failed && code !== SIGN_IN_ERROR.unavailable) {
            return;
        }
        if (code === SIGN_IN_ERROR.unavailable) {
            showSavingNotice("signin-failed");
        }
        window.history.replaceState(window.history.state, "", window.location.pathname);
    }, [showSavingNotice]);

    const contextValue = useMemo(() => ({
        user,
        completedDates,
        playedDates,
        loading,
        logout,
        refreshUser: fetchUser,
        addCompletedDate,
        addPlayedDate,
        tokenBalance,
        settings,
        setTokenBalance,
        adjustTokenBalance,
        updateSettings,
        savingPaused,
        sentSolves,
        savingNotice,
        showSavingNotice,
        dismissSavingNotice
    }), [user, completedDates, playedDates, loading, logout, fetchUser, addCompletedDate, addPlayedDate, tokenBalance, settings, adjustTokenBalance, updateSettings,
        savingPaused, sentSolves, savingNotice, showSavingNotice, dismissSavingNotice]);

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextValue => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
