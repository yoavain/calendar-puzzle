import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StatsModal } from "./StatsModal";
import { MOCK_COMPLETED_DATES, MOCK_PLAYED_DATES, STORY_DATE } from "../storybook/mockData";
import { MOCK_USER_REGULAR } from "../storybook/MockUserProvider";

const meta: Meta<typeof StatsModal> = {
    title: "Dialogs/StatsModal",
    component: StatsModal,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof StatsModal>;

export const WithStats: Story = {
    parameters: {
        userContext: {
            user: MOCK_USER_REGULAR,
            completedDates: MOCK_COMPLETED_DATES,
            playedDates: MOCK_PLAYED_DATES
        }
    },
    render: () => <StatsModal open={true} onClose={() => {}} />
};

/** Opened by a solve: it names the date and offers the next one. */
export const JustSolved: Story = {
    parameters: {
        userContext: {
            user: MOCK_USER_REGULAR,
            completedDates: MOCK_COMPLETED_DATES,
            playedDates: MOCK_PLAYED_DATES
        }
    },
    render: () => (
        <StatsModal
            open={true}
            onClose={() => {}}
            solveResult={{ solvedDate: STORY_DATE, nextDate: { month: 1, day: 19 } }}
            onPlayNext={() => {}}
        />
    )
};

/** The last date of the year: there's nothing to offer, and Close leads to Year Complete. */
export const SolvedLastDate: Story = {
    parameters: {
        userContext: {
            user: MOCK_USER_REGULAR,
            completedDates: MOCK_COMPLETED_DATES,
            playedDates: MOCK_PLAYED_DATES
        }
    },
    render: () => <StatsModal open={true} onClose={() => {}} solveResult={{ solvedDate: STORY_DATE, nextDate: null }} />
};

export const NoHistory: Story = {
    parameters: {
        userContext: {
            user: MOCK_USER_REGULAR,
            completedDates: [],
            playedDates: []
        }
    },
    render: () => <StatsModal open={true} onClose={() => {}} />
};
