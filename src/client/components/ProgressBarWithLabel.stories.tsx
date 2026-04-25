import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBarWithLabel } from "./ProgressBarWithLabel";

const meta: Meta<typeof ProgressBarWithLabel> = {
    title: "UI/ProgressBarWithLabel",
    component: ProgressBarWithLabel,
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

type Story = StoryObj<typeof ProgressBarWithLabel>;

export const DefaultColor: Story = {
    args: { value: 50, label: "50%", ariaLabel: "Default progress" }
};

export const CustomColor: Story = {
    args: { value: 75, label: "75%", color: "#22c55e", ariaLabel: "Custom progress" }
};

export const CountLabel: Story = {
    args: { value: 30, label: "30 / 366", ariaLabel: "Overall completion progress" }
};

export const Empty: Story = {
    args: { value: 0, label: "0%" }
};

export const Full: Story = {
    args: { value: 100, label: "100%", color: "#22c55e" }
};
