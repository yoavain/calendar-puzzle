import React, { useState } from "react";
import type { Meta, StoryObj, Decorator } from "@storybook/react";
import { DndContext } from "@dnd-kit/core";
import { PieceCarousel } from "../layouts/common/PieceCarousel";
import { makeMockPieces } from "../storybook/mockData";
import type { Piece } from "../../common/types";
import type { PieceId } from "../../common/pieceData";
import { PiecesContainer } from "../layouts/desktop/DesktopLayout.styled";

// DraggablePiece uses useDndMonitor which requires a DndContext ancestor
const withDndContext: Decorator = (Story) => (
    <DndContext>
        <Story />
    </DndContext>
);

const meta: Meta<typeof PieceCarousel> = {
    title: "Game/PieceCarousel",
    component: PieceCarousel,
    decorators: [withDndContext],
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof PieceCarousel>;

const noop = () => {};

export const AllPieces: Story = {
    render: () => {
        const pieces = makeMockPieces();
        return (
            <div style={{ width: 350 }}>
                <PieceCarousel
                    pieces={pieces}
                    selectedPieceId={pieces[0].id}
                    onPieceSelect={noop}
                    onRotatePiece={noop}
                    onRotateCCWPiece={noop}
                    onFlipHPiece={noop}
                    onFlipVPiece={noop}
                />
            </div>
        );
    }
};

export const TwoPieces: Story = {
    name: "Two Pieces (slide duplication)",
    render: () => {
        const pieces = makeMockPieces().slice(0, 2);
        return (
            <div style={{ width: 350 }}>
                <PieceCarousel
                    pieces={pieces}
                    selectedPieceId={pieces[0].id}
                    onPieceSelect={noop}
                    onRotatePiece={noop}
                    onRotateCCWPiece={noop}
                    onFlipHPiece={noop}
                    onFlipVPiece={noop}
                />
            </div>
        );
    }
};

const DesktopWidthStory = (): React.JSX.Element => {
    const [pieces, setPieces] = useState(makeMockPieces);
    const [selectedPieceId, setSelectedPieceId] = useState<PieceId | null>(pieces[0]?.id ?? null);

    const updatePiece = (id: number, patch: Partial<Piece>) =>
        setPieces(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));

    return (
        <PiecesContainer>
            <PieceCarousel
                pieces={pieces}
                selectedPieceId={selectedPieceId}
                onPieceSelect={setSelectedPieceId}
                onRotatePiece={id => {
                    const p = pieces.find(p => p.id === id)!;
                    updatePiece(id, { rotation: ((p.rotation + 90) % 360) as Piece["rotation"] });
                }}
                onRotateCCWPiece={id => {
                    const p = pieces.find(p => p.id === id)!;
                    updatePiece(id, { rotation: ((p.rotation + 270) % 360) as Piece["rotation"] });
                }}
                onFlipHPiece={id => {
                    const p = pieces.find(p => p.id === id)!;
                    updatePiece(id, { isFlippedH: !p.isFlippedH });
                }}
                onFlipVPiece={id => {
                    const p = pieces.find(p => p.id === id)!;
                    updatePiece(id, { isFlippedV: !p.isFlippedV });
                }}
            />
        </PiecesContainer>
    );
};

export const DesktopWidth: Story = {
    name: "Desktop Width",
    parameters: { layout: "fullscreen" },
    render: DesktopWidthStory
};

export const Empty: Story = {
    render: () => (
        <div style={{ width: 350 }}>
            <PieceCarousel
                pieces={[] as Piece[]}
                selectedPieceId={null}
                onPieceSelect={noop}
                onRotatePiece={noop}
                onRotateCCWPiece={noop}
                onFlipHPiece={noop}
                onFlipVPiece={noop}
            />
        </div>
    )
};
