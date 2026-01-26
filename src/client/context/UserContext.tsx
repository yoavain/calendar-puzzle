import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PuzzleDate } from "../../common/types.js";
import { clearCsrfToken, getCsrfToken } from "../service/puzzleService";
import { logToServer } from "../service/logService.js";
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
}

const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [completedDates, setCompletedDates] = useState<PuzzleDate[]>([]);
    const [playedDates, setPlayedDates] = useState<PuzzleDate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch(API_AUTH_ME, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setCompletedDates(data.completedDates || []);
                setPlayedDates(data.playedDates || []);
                
                // Fetch CSRF token separately after authenticated session is established
                getCsrfToken().catch(err => {
                    logToServer("error", "UserContext: Failed to fetch CSRF token", err, data.user?.id);
                });
            }
            else {
                setUser(null);
                setCompletedDates([]);
                setPlayedDates([]);
                clearCsrfToken();
            }
        }
        catch (error) {
            logToServer("error", "UserContext: Failed to fetch user", error);
            setUser(null);
            setCompletedDates([]);
            setPlayedDates([]);
            clearCsrfToken();
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            setCompletedDates([]);
            setPlayedDates([]);
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
            logToServer("error", "UserContext: Failed to get CSRF token for logout", err, user?.id);
        }

        try {
            await fetch(AUTH_LOGOUT, {
                method: "POST",
                headers,
                credentials: "include"
            });
        }
        catch (err) {
            logToServer("error", "UserContext: Logout request failed", err, user?.id);
        }
        setUser(null);
        setCompletedDates([]);
        setPlayedDates([]);
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

    return (
        <UserContext.Provider value={{ 
            user, 
            completedDates, 
            playedDates,
            loading, 
            logout, 
            refreshUser: fetchUser,
            addCompletedDate,
            addPlayedDate
        }}>
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
