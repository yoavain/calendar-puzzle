import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { LoginButton } from "./LoginButton";

const meta: Meta<typeof LoginButton> = {
    title: "UI/LoginButton",
    component: LoginButton,
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof LoginButton>;

export const Default: Story = {
    render: () => <LoginButton />
};
