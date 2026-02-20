import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { UserMenu } from "./UserMenu";
import { MOCK_USER_REGULAR, MOCK_USER_ADMIN } from "../storybook/MockUserProvider";

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
