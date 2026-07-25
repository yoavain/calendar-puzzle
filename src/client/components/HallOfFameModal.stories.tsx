import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { HallOfFameModal } from "./HallOfFameModal";
import { MOCK_USER_REGULAR } from "../storybook/MockUserProvider";
import { TOTAL_DATES } from "../../common/consts";
import type { UserActivity } from "../../common/restTypes";

const MOCK_HALL_OF_FAME: UserActivity[] = [
    { userKey: "fake-key-story-user", isCurrentUser: true, daysPlayed: 120, daysSolved: 115, daysPlayedWithHint: 10, daysSolvedWithHint: 8 },
    { userKey: "fake-key-alice", isCurrentUser: false, daysPlayed: 98, daysSolved: 90, daysPlayedWithHint: 5, daysSolvedWithHint: 3 },
    { userKey: "fake-key-bob", isCurrentUser: false, daysPlayed: 75, daysSolved: 60, daysPlayedWithHint: 20, daysSolvedWithHint: 15 },
    { userKey: "fake-key-carol", isCurrentUser: false, daysPlayed: 60, daysSolved: 58, daysPlayedWithHint: 2, daysSolvedWithHint: 2 },
    { userKey: "fake-key-dave", isCurrentUser: false, daysPlayed: 45, daysSolved: 30, daysPlayedWithHint: 12, daysSolvedWithHint: 8 },
    { userKey: "fake-key-eve", isCurrentUser: false, daysPlayed: 30, daysSolved: 28, daysPlayedWithHint: 0, daysSolvedWithHint: 0 },
    { userKey: "fake-key-frank", isCurrentUser: false, daysPlayed: 10, daysSolved: 5, daysPlayedWithHint: 3, daysSolvedWithHint: 1 }
];

/** Two players who have solved every date, so the completion badge is visible. */
const MOCK_WITH_COMPLETERS: UserActivity[] = [
    { userKey: "fake-key-story-user", isCurrentUser: true, daysPlayed: 412, daysSolved: TOTAL_DATES, daysPlayedWithHint: 30, daysSolvedWithHint: 22 },
    { userKey: "fake-key-alice", isCurrentUser: false, daysPlayed: 389, daysSolved: TOTAL_DATES, daysPlayedWithHint: 12, daysSolvedWithHint: 9 },
    ...MOCK_HALL_OF_FAME.slice(1)
];

/** Serves a fixed hall-of-fame payload for the duration of a story. */
const mockHallOfFameFetch = (users: UserActivity[]) => () => {
    const original = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes("hall-of-fame")) {
            return new Response(
                JSON.stringify({ users }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }
        return original(input, init);
    };
    return () => {
        globalThis.fetch = original;
    };
};

const meta: Meta<typeof HallOfFameModal> = {
    title: "Dialogs/HallOfFameModal",
    component: HallOfFameModal,
    parameters: {
        layout: "fullscreen",
        userContext: { user: MOCK_USER_REGULAR }
    }
};
export default meta;

type Story = StoryObj<typeof HallOfFameModal>;

export const Open: Story = {
    beforeEach: mockHallOfFameFetch(MOCK_HALL_OF_FAME),
    render: () => <HallOfFameModal open={true} onClose={() => {}} />
};

/** The completion badge replaces the old gold/silver/bronze rank trophies. */
export const WithCompletedPlayers: Story = {
    beforeEach: mockHallOfFameFetch(MOCK_WITH_COMPLETERS),
    render: () => <HallOfFameModal open={true} onClose={() => {}} />
};
