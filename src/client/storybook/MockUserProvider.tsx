import React from "react";
import type { ReactNode } from "react";
import { UserContext } from "../context/UserContext";
import type { User } from "../context/UserContext";
import type { PuzzleDate } from "../../common/types";

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

interface Props {
    children: ReactNode;
    user?: User | null;
    completedDates?: PuzzleDate[];
    playedDates?: PuzzleDate[];
    loading?: boolean;
}

export const MockUserProvider = ({
    children,
    user = null,
    completedDates = [],
    playedDates = [],
    loading = false
}: Props) => (
    <UserContext.Provider value={{
        user,
        completedDates,
        playedDates,
        loading,
        logout: async () => {},
        refreshUser: async () => {},
        addCompletedDate: () => {},
        addPlayedDate: () => {}
    }}>
        {children}
    </UserContext.Provider>
);
