import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PuzzleDate } from '../../common/types.js';
import { clearCsrfToken, getCsrfToken } from '../service/puzzleService';

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
    playedCount: number;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    addCompletedDate: (date: PuzzleDate) => void;
    incrementPlayedCount: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [completedDates, setCompletedDates] = useState<PuzzleDate[]>([]);
    const [playedCount, setPlayedCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setCompletedDates(data.completedDates || []);
                setPlayedCount(data.playedCount || 0);
                
                // Fetch CSRF token separately after authenticated session is established
                await getCsrfToken();
            } else {
                setUser(null);
                setCompletedDates([]);
                setPlayedCount(0);
                clearCsrfToken();
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setUser(null);
            setCompletedDates([]);
            setPlayedCount(0);
            clearCsrfToken();
        } finally {
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
            headers['X-CSRF-Token'] = csrfToken;
        }

        await fetch('/auth/logout', {
            method: 'POST',
            headers,
            credentials: 'include'
        });
        setUser(null);
        setCompletedDates([]);
        setPlayedCount(0);
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

    const incrementPlayedCount = useCallback(() => {
        setPlayedCount(prev => prev + 1);
    }, []);

    return (
        <UserContext.Provider value={{ 
            user, 
            completedDates, 
            playedCount,
            loading, 
            logout, 
            refreshUser: fetchUser,
            addCompletedDate,
            incrementPlayedCount
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser(): UserContextValue {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
