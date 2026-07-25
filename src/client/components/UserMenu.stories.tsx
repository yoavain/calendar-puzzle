import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { UserMenu } from "./UserMenu";
import { MOCK_USER_REGULAR, MOCK_USER_ADMIN } from "../storybook/MockUserProvider";
import { DAYS_IN_MONTH } from "../../common/consts";
import type { PuzzleDate } from "../../common/types";

/** Every date on the calendar — the state that earns the completion badge. */
const ALL_DATES: PuzzleDate[] = DAYS_IN_MONTH.flatMap((days, month) =>
    Array.from({ length: days }, (_, i) => ({ month, day: i + 1 }))
);

const meta: Meta<typeof UserMenu> = {
    title: "UI/UserMenu",
    component: UserMenu,
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof UserMenu>;

export const LoggedIn: Story = {
    parameters: {
        userContext: { user: MOCK_USER_REGULAR }
    },
    render: () => <UserMenu />
};

export const Admin: Story = {
    parameters: {
        userContext: { user: MOCK_USER_ADMIN }
    },
    render: () => <UserMenu />
};

export const LoggedOut: Story = {
    parameters: {
        userContext: { user: null }
    },
    render: () => <UserMenu />
};

/** All 366 dates solved: the completion badge sits on the avatar. */
export const CompletedEveryDate: Story = {
    parameters: {
        userContext: { user: MOCK_USER_REGULAR, completedDates: ALL_DATES, playedDates: ALL_DATES }
    },
    render: () => <UserMenu />
};

/** One date short — the badge must not appear. */
export const OneDateShort: Story = {
    parameters: {
        userContext: {
            user: MOCK_USER_REGULAR,
            completedDates: ALL_DATES.slice(0, -1),
            playedDates: ALL_DATES
        }
    },
    render: () => <UserMenu />
};
