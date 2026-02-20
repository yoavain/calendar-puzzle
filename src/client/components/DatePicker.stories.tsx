import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "./DatePicker";
import { STORY_DATE, MOCK_COMPLETED_DATES, MOCK_PLAYED_DATES } from "../storybook/mockData";
import { MOCK_USER_REGULAR } from "../storybook/MockUserProvider";

const meta: Meta<typeof DatePicker> = {
    title: "UI/DatePicker",
    component: DatePicker,
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

export const WithHistory: Story = {
    parameters: {
        userContext: {
            user: MOCK_USER_REGULAR,
            completedDates: MOCK_COMPLETED_DATES,
            playedDates: MOCK_PLAYED_DATES
        }
    },
    render: () => (
        <DatePicker
            currentDate={STORY_DATE}
            onDateChange={() => {}}
        />
    )
};

export const Anonymous: Story = {
    parameters: {
        userContext: {
            user: null,
            completedDates: [],
            playedDates: []
        }
    },
    render: () => (
        <DatePicker
            currentDate={STORY_DATE}
            onDateChange={() => {}}
        />
    )
};
