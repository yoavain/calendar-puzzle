import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { HallOfFameModal } from "./HallOfFameModal";
import { MOCK_USER_REGULAR } from "../storybook/MockUserProvider";
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
    beforeEach() {
        const original = globalThis.fetch;
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            if (String(input).includes("hall-of-fame")) {
                return new Response(
                    JSON.stringify({ users: MOCK_HALL_OF_FAME }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            }
            return original(input, init);
        };
        return () => {
            globalThis.fetch = original; 
        };
    },
    render: () => <HallOfFameModal open={true} onClose={() => {}} />
};
