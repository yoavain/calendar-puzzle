import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface User {
    id: string;
    email: string;
    name: string;
}

interface UserContextValue {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/auth/user', {
            credentials: 'include'
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                setUser(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const logout = useCallback(async () => {
        await fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        setUser(null);
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, logout }}>
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
