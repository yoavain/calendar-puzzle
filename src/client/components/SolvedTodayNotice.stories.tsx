import type { Meta, StoryObj } from "@storybook/react";
import { SolvedTodayNotice } from "./SolvedTodayNotice";

const meta: Meta<typeof SolvedTodayNotice> = {
    title: "UI/SolvedTodayNotice",
    component: SolvedTodayNotice,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof SolvedTodayNotice>;

export const Open: Story = {
    args: {
        open: true,
        nextDate: { month: 1, day: 19 },
        onPlay: () => {},
        onClose: () => {}
    }
};
