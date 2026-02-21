import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ShareDialog } from "./ShareDialog";

const meta: Meta<typeof ShareDialog> = {
    title: "Dialogs/ShareDialog",
    component: ShareDialog,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof ShareDialog>;

export const Open: Story = {
    render: () => <ShareDialog open={true} onClose={() => {}} />
};
