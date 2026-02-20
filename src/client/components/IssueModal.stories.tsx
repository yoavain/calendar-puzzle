import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { IssueModal } from "./IssueModal";

const meta: Meta<typeof IssueModal> = {
    title: "Dialogs/IssueModal",
    component: IssueModal,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof IssueModal>;

export const Open: Story = {
    render: () => <IssueModal open={true} onClose={() => {}} />
};
