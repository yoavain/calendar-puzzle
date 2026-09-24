import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { PIECE_IDS } from "../../common/pieceData";
import type { PieceId } from "../../common/pieceData";
import { getPieceColor } from "../utils/pieceColors";
import { PlacementProgressBar } from "./PlacementProgressBar";

const meta: Meta<typeof PlacementProgressBar> = {
    title: "UI/PlacementProgressBar",
    component: PlacementProgressBar,
    // No width wrapper: ProgressContainer sizes itself to the board width.
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof PlacementProgressBar>;

export const Empty: Story = {
    args: { order: [] }
};

export const ThreePieces: Story = {
    args: { order: [6, 2, 8] }
};

export const SevenPieces: Story = {
    args: { order: [6, 2, 8, 1, 4, 3, 7] }
};

export const Complete: Story = {
    args: { order: [6, 2, 8, 1, 4, 3, 7, 5] }
};

/** Click a piece to place it (appends) or take it off the board (removes). */
const PlaygroundDemo: React.FC = () => {
    const [order, setOrder] = useState<PieceId[]>([]);
    const toggle = (id: PieceId) =>
        setOrder(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));

    return (
        <Stack spacing={1}>
            <PlacementProgressBar order={order} />
            <Stack direction="row" spacing={0.5} sx={{ justifyContent: "center" }}>
                {PIECE_IDS.map(id => (
                    <Button
                        key={id}
                        size="small"
                        variant={order.includes(id) ? "outlined" : "contained"}
                        onClick={() => toggle(id)}
                        sx={{ minWidth: 32, px: 0, bgcolor: order.includes(id) ? undefined : getPieceColor(id) }}
                    >
                        {id}
                    </Button>
                ))}
            </Stack>
        </Stack>
    );
};

export const Playground: Story = {
    render: () => <PlaygroundDemo />
};
