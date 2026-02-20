import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StatsModal } from "./StatsModal";
import { MOCK_COMPLETED_DATES, MOCK_PLAYED_DATES } from "../storybook/mockData";
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
