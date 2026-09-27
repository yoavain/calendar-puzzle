import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TokenIntroDialog } from "./TokenIntroDialog";

const meta: Meta<typeof TokenIntroDialog> = {
    title: "Dialogs/TokenIntroDialog",
    component: TokenIntroDialog,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof TokenIntroDialog>;

export const ExistingUser: Story = {
    render: () => <TokenIntroDialog open={true} tokenBalance={12} solvedCount={12} isFirstView={true} onClose={() => {}} />
};

export const NewUser: Story = {
    render: () => <TokenIntroDialog open={true} tokenBalance={0} solvedCount={0} isFirstView={true} onClose={() => {}} />
};

export const ReopenedAfterSpending: Story = {
    render: () => <TokenIntroDialog open={true} tokenBalance={5} solvedCount={12} isFirstView={false} onClose={() => {}} />
};
