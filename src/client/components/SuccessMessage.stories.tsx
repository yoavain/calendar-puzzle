import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SuccessMessage } from "./SuccessMessage";

const meta: Meta<typeof SuccessMessage> = {
    title: "Dialogs/SuccessMessage",
    component: SuccessMessage,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof SuccessMessage>;

export const Visible: Story = {
    render: () => <SuccessMessage isVisible={true} onClose={() => {}} />
};
