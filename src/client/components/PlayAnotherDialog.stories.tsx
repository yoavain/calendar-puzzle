import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PlayAnotherDialog } from "./PlayAnotherDialog";

const meta: Meta<typeof PlayAnotherDialog> = {
    title: "Dialogs/PlayAnotherDialog",
    component: PlayAnotherDialog,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof PlayAnotherDialog>;

export const JustSolved: Story = {
    render: () => (
        <PlayAnotherDialog
            isOpen={true}
            mode="just-solved"
            onAccept={() => {}}
            onDecline={() => {}}
        />
    )
};

export const AlreadySolved: Story = {
    render: () => (
        <PlayAnotherDialog
            isOpen={true}
            mode="already-solved"
            onAccept={() => {}}
            onDecline={() => {}}
        />
    )
};
