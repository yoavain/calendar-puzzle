import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
    title: "UI/ProgressBar",
    component: ProgressBar,
    parameters: { layout: "centered" },
    decorators: [
        (Story) => (
            <div style={{ width: 300 }}>
                <Story />
            </div>
        )
    ]
};
export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Empty: Story = {
    args: { covered: 0, total: 45, percentage: 0 }
};

export const OneThird: Story = {
    args: { covered: 15, total: 45, percentage: 33 }
};

export const TwoThirds: Story = {
    args: { covered: 30, total: 45, percentage: 67 }
};

export const Complete: Story = {
    args: { covered: 45, total: 45, percentage: 100 }
};
