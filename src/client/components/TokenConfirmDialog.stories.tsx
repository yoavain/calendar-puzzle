import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TokenConfirmDialog } from "./TokenConfirmDialog";

const meta: Meta<typeof TokenConfirmDialog> = {
    title: "Dialogs/TokenConfirmDialog",
    component: TokenConfirmDialog,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof TokenConfirmDialog>;

export const ThreeTokens: Story = {
    render: () => (
        <TokenConfirmDialog
            open={true}
            tokenBalance={3}
            onConfirm={() => {}}
            onCancel={() => {}}
        />
    )
};
