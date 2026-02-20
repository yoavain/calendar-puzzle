import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PieceControls } from "./PieceControls";
import type { Piece } from "../../common/types";
import Box from "@mui/material/Box";

const mockPiece: Piece = {
    id: 1,
    position: null,
    isFlippedH: false,
    isFlippedV: false,
    rotation: 0 as const
};

const meta: Meta<typeof PieceControls> = {
    title: "Game/PieceControls",
    component: PieceControls,
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof PieceControls>;

export const Default: Story = {
    render: () => (
        <Box sx={{ position: "relative", width: 200, height: 80 }}>
            <PieceControls
                piece={mockPiece}
                onRotate={() => {}}
                onRotateCCW={() => {}}
                onFlipH={() => {}}
                onFlipV={() => {}}
            />
        </Box>
    )
};
