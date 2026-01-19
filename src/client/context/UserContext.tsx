import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { PuzzleDate } from "../../common/types.js";
import { clearCsrfToken, getCsrfToken } from "../service/puzzleService";

export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    isAdmin: boolean;
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
            const res = await fetch("/api/auth/me", {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setCompletedDates(data.completedDates || []);
                setPlayedDates(data.playedDates || []);
                
                // Fetch CSRF token separately after authenticated session is established
                await getCsrfToken();
            }
            else {
                setUser(null);
                setCompletedDates([]);
                setPlayedDates([]);
                clearCsrfToken();
            }
        }
        catch (error) {
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

    const logout = useCallback(async () => {
        const headers: Record<string, string> = {};
        const csrfToken = await getCsrfToken();
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }

        await fetch("/auth/logout", {
            method: "POST",
            headers,
            credentials: "include"
        });
        setUser(null);
        setCompletedDates([]);
        setPlayedDates([]);
        clearCsrfToken();
    }, []);

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
