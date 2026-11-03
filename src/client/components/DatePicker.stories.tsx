import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "./DatePicker";
import { toPuzzleDate } from "../../common/types";
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

const TODAY = toPuzzleDate(new Date());

/** A solved today stays yellow, with a small green mark for its status. */
export const TodaySolved: Story = {
    parameters: {
        userContext: {
            user: MOCK_USER_REGULAR,
            completedDates: [TODAY],
            playedDates: [TODAY]
        }
    },
    render: () => (
        <DatePicker
            currentDate={TODAY}
            onDateChange={() => {}}
        />
    )
};

/** A started today stays yellow, with a small violet mark for its status. */
export const TodayStarted: Story = {
    parameters: {
        userContext: {
            user: MOCK_USER_REGULAR,
            completedDates: [],
            playedDates: [TODAY]
        }
    },
    render: () => (
        <DatePicker
            currentDate={TODAY}
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
