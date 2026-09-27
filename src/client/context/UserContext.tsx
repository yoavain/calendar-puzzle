import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PuzzleDate } from "../../common/types.js";
import type { UserSettings } from "../../common/restTypes.js";
import { clearCsrfToken, getCsrfToken } from "../service/csrfService";
import { logToServer } from "../service/logService.js";
import { saveUserSettings } from "../service/puzzleService.js";
import { API_AUTH_ME, AUTH_LOGOUT } from "../../common/restPaths.js";

export interface User {
    id: string;
    isAdmin: boolean;
    // PII from session only
    email?: string;
    name?: string;
    avatarUrl?: string | null;
}

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
}

export const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [completedDates, setCompletedDates] = useState<PuzzleDate[]>([]);
    const [playedDates, setPlayedDates] = useState<PuzzleDate[]>([]);
    const [loading, setLoading] = useState(true);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [settings, setSettings] = useState<UserSettings>({});

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch(API_AUTH_ME, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setUser(data.user);
                    setCompletedDates(data.completedDates || []);
                    setPlayedDates(data.playedDates || []);
                    setTokenBalance(data.tokenBalance ?? 0);
                    setSettings(data.settings ?? {});
                    
                    // Fetch CSRF token separately after authenticated session is established
                    getCsrfToken().catch(err => {
                        logToServer("error", "UserContext: Failed to fetch CSRF token", err);
                    });
                }
                else {
                    setUser(null);
                    setCompletedDates([]);
                    setPlayedDates([]);
                    setTokenBalance(0);
                    setSettings({});
                    clearCsrfToken();
                }
            }
            else {
                setUser(null);
                setCompletedDates([]);
                setPlayedDates([]);
                setTokenBalance(0);
                setSettings({});
                clearCsrfToken();
            }
        }
        catch (error) {
            logToServer("error", "UserContext: Failed to fetch user", error);
            setUser(null);
            setCompletedDates([]);
            setPlayedDates([]);
            setTokenBalance(0);
            setSettings({});
            clearCsrfToken();
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser().catch(() => {});
    }, [fetchUser]);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            setCompletedDates([]);
            setPlayedDates([]);
            setTokenBalance(0);
            setSettings({});
            clearCsrfToken();
        };

        window.addEventListener("app:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("app:unauthorized", handleUnauthorized);
    }, []);

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
        setUser(null);
        setCompletedDates([]);
        setPlayedDates([]);
        setTokenBalance(0);
        setSettings({});
        clearCsrfToken();
    }, [user]);

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
        updateSettings
    }), [user, completedDates, playedDates, loading, logout, fetchUser, addCompletedDate, addPlayedDate, tokenBalance, settings, adjustTokenBalance, updateSettings]);

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
