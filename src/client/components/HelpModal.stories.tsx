import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { HelpModal } from "./HelpModal";

const meta: Meta<typeof HelpModal> = {
    title: "Dialogs/HelpModal",
    component: HelpModal,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof HelpModal>;

export const Open: Story = {
    render: () => <HelpModal open={true} onClose={() => {}} />
};
