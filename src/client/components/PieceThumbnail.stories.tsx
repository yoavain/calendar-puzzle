import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PieceThumbnail } from "./PieceThumbnail";
import { PIECE_IDS } from "../../common/pieceData";

const meta: Meta<typeof PieceThumbnail> = {
    title: "Game/PieceThumbnail",
    component: PieceThumbnail,
    parameters: { layout: "centered" },
    args: { pieceId: 1, isActive: false, isPlaced: false, onSelect: () => {} }
};
export default meta;

type Story = StoryObj<typeof PieceThumbnail>;

export const Default: Story = {};

export const Active: Story = { args: { isActive: true } };

export const Placed: Story = { args: { isPlaced: true } };

/** The whole strip as the portrait carousel shows it: piece 3 active, pieces 2, 5 and 7 placed. */
export const Strip: Story = {
    render: () => (
        <div role="tablist" aria-label="Pieces" style={{ display: "flex", gap: 2 }}>
            {PIECE_IDS.map(id => (
                <PieceThumbnail
                    key={id}
                    pieceId={id}
                    isActive={id === 3}
                    isPlaced={[2, 5, 7].includes(id)}
                    onSelect={() => {}}
                />
            ))}
        </div>
    )
};
