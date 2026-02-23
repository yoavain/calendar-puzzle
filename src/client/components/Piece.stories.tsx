import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Piece } from "./Piece";
import { PieceControls } from "./PieceControls";
import type { Piece as PieceType } from "../../common/types";
import type { PieceId } from "../../common/pieceData";
import { PIECE_IDS } from "../../common/pieceData";
import { PiecePoolWrapper, PiecesContainer } from "../layouts/desktop/DesktopLayout.styled";

const makePiece = (id: PieceId, overrides: Partial<PieceType> = {}): PieceType => ({
    id,
    position: null,
    isFlippedH: false,
    isFlippedV: false,
    rotation: 0 as const,
    ...overrides
});

const meta: Meta<typeof Piece> = {
    title: "Game/Piece",
    component: Piece,
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof Piece>;

// One story per piece ID
export const Piece1: Story = {
    render: () => <Piece piece={makePiece(1)} onClick={() => {}} />
};
export const Piece2: Story = {
    render: () => <Piece piece={makePiece(2)} onClick={() => {}} />
};
export const Piece3: Story = {
    render: () => <Piece piece={makePiece(3)} onClick={() => {}} />
};
export const Piece4: Story = {
    render: () => <Piece piece={makePiece(4)} onClick={() => {}} />
};
export const Piece5: Story = {
    render: () => <Piece piece={makePiece(5)} onClick={() => {}} />
};
export const Piece6: Story = {
    render: () => <Piece piece={makePiece(6)} onClick={() => {}} />
};
export const Piece7: Story = {
    render: () => <Piece piece={makePiece(7)} onClick={() => {}} />
};
export const Piece8: Story = {
    render: () => <Piece piece={makePiece(8)} onClick={() => {}} />
};

export const Rotated90: Story = {
    render: () => <Piece piece={makePiece(1, { rotation: 90 })} onClick={() => {}} />
};

export const FlippedH: Story = {
    render: () => <Piece piece={makePiece(1, { isFlippedH: true })} onClick={() => {}} />
};

/** All 8 pieces in the game's 4×2 grid layout */
export const AllPieces: Story = {
    parameters: { layout: "fullscreen" },
    render: () => (
        <PiecesContainer>
            {PIECE_IDS.map(id => (
                <PiecePoolWrapper key={id}>
                    <Piece piece={makePiece(id)} onClick={() => {}} />
                </PiecePoolWrapper>
            ))}
        </PiecesContainer>
    )
};

type PieceTransform = { rotation: 0 | 90 | 180 | 270; isFlippedH: boolean; isFlippedV: boolean };

const initialTransforms = (): Record<number, PieceTransform> =>
    Object.fromEntries(PIECE_IDS.map(id => [id, { rotation: 0, isFlippedH: false, isFlippedV: false }]));

/** All 8 pieces in the game's 4×2 grid layout, each with working rotate/flip controls */
const AllPiecesWithControlsStory = (): React.JSX.Element => {
    const [transforms, setTransforms] = useState<Record<number, PieceTransform>>(initialTransforms);

    const update = (id: number, patch: Partial<PieceTransform>) =>
        setTransforms(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

    return (
        <PiecesContainer>
            {PIECE_IDS.map(id => {
                const t = transforms[id];
                const piece: PieceType = { id, position: null, ...t };
                return (
                    <PiecePoolWrapper key={id}>
                        <Piece piece={piece} onClick={() => {}} />
                        <PieceControls
                            piece={piece}
                            onRotate={() => update(id, { rotation: ((t.rotation + 90) % 360) as PieceTransform["rotation"] })}
                            onRotateCCW={() => update(id, { rotation: ((t.rotation + 270) % 360) as PieceTransform["rotation"] })}
                            onFlipH={() => update(id, { isFlippedH: !t.isFlippedH })}
                            onFlipV={() => update(id, { isFlippedV: !t.isFlippedV })}
                        />
                    </PiecePoolWrapper>
                );
            })}
        </PiecesContainer>
    );
};

export const AllPiecesWithControls: Story = {
    parameters: { layout: "fullscreen" },
    render: AllPiecesWithControlsStory
};
