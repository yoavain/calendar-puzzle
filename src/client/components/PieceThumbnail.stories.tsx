import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PieceThumbnail } from "./PieceThumbnail";
import { makeMockPieces } from "../storybook/mockData";
import type { Piece } from "../../common/types";

const pieces = makeMockPieces();
const piece = (id: number, patch: Partial<Piece> = {}): Piece => ({ ...pieces.find(p => p.id === id)!, ...patch });

const meta: Meta<typeof PieceThumbnail> = {
    title: "Game/PieceThumbnail",
    component: PieceThumbnail,
    parameters: { layout: "centered" },
    args: { piece: piece(1), isActive: false, isPlaced: false, onSelect: () => {} }
};
export default meta;

type Story = StoryObj<typeof PieceThumbnail>;

export const Default: Story = {};

export const Active: Story = { args: { isActive: true } };

export const Placed: Story = { args: { isPlaced: true } };

/** The tile follows the piece: here rotated 90 degrees and flipped horizontally. */
export const RotatedAndFlipped: Story = {
    args: { piece: piece(1, { rotation: 90, isFlippedH: true }) }
};

/** A placed piece keeps the orientation it has on the board. */
export const PlacedRotated: Story = {
    args: { piece: piece(1, { rotation: 90, position: { x: 2, y: 2 } }), isPlaced: true }
};

/** The whole strip as the portrait carousel shows it: piece 3 active, pieces 2, 5 and 7 placed, piece 4 rotated. */
export const Strip: Story = {
    render: () => (
        <div role="tablist" aria-label="Pieces" style={{ display: "flex", gap: 2 }}>
            {pieces.map(p => (
                <PieceThumbnail
                    key={p.id}
                    piece={p.id === 4 ? { ...p, rotation: 90 } : p}
                    isActive={p.id === 3}
                    isPlaced={[2, 5, 7].includes(p.id)}
                    onSelect={() => {}}
                />
            ))}
        </div>
    )
};
