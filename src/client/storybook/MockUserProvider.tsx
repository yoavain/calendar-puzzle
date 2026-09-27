import React, { useMemo } from "react";
import type { ReactNode } from "react";
import { UserContext } from "../context/UserContext";
import type { User } from "../context/UserContext";
import type { PuzzleDate } from "../../common/types";
import type { UserSettings } from "../../common/restTypes";

export const MOCK_USER_REGULAR: User = {
    id: "story-user",
    isAdmin: false,
    email: "story@example.com",
    name: "Story User",
    avatarUrl: null
};

export const MOCK_USER_ADMIN: User = {
    ...MOCK_USER_REGULAR,
    id: "story-admin",
    isAdmin: true,
    name: "Admin User"
};

// Stable empty defaults. A `= []` default builds a new array on every render, which
// would change the memoized context value each time. The two lists get their own
// constant, so a future push to one cannot show up in the other.
const NO_COMPLETED_DATES: PuzzleDate[] = [];
const NO_PLAYED_DATES: PuzzleDate[] = [];
const NO_SETTINGS: UserSettings = {};
const noop = () => {};
const noopAsync = async () => {};

interface Props {
    children: ReactNode;
    user?: User | null;
    completedDates?: PuzzleDate[];
    playedDates?: PuzzleDate[];
    loading?: boolean;
    tokenBalance?: number;
    settings?: UserSettings;
    setTokenBalance?: (balance: number) => void;
    adjustTokenBalance?: (delta: number) => void;
    updateSettings?: (patch: UserSettings) => Promise<void>;
    addCompletedDate?: (date: PuzzleDate) => void;
}

export const MockUserProvider = ({
    children,
    user = null,
    completedDates = NO_COMPLETED_DATES,
    playedDates = NO_PLAYED_DATES,
    loading = false,
    tokenBalance = 0,
    settings = NO_SETTINGS,
    setTokenBalance = noop,
    adjustTokenBalance = noop,
    updateSettings = noopAsync,
    addCompletedDate = noop
}: Props) => {
    const value = useMemo(() => ({
        user,
        completedDates,
        playedDates,
        loading,
        logout: async () => {},
        refreshUser: async () => {},
        addCompletedDate,
        addPlayedDate: () => {},
        tokenBalance,
        settings,
        setTokenBalance,
        adjustTokenBalance,
        updateSettings
    }), [user, completedDates, playedDates, loading, tokenBalance, settings, setTokenBalance, adjustTokenBalance, updateSettings, addCompletedDate]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
