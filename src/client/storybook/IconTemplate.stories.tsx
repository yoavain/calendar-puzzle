import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { styled } from "@mui/material/styles";
import { Board } from "../components/Board";
import { Piece } from "../components/Piece";
import { makeMockBoard, makeMockPieces, JAN_1 } from "./mockData";

const noop = () => {};

const Scene = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2)
}));

/**
 * Tightly packed 4x2 pieces grid (game order, no controls).
 * Overrides PieceWrapper's pool sizing (width 100%, minHeight of 4 cells)
 * so each piece occupies only its natural shape size.
 */
const TightPiecesGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(4, auto)",
    gap: theme.spacing(1.5),
    justifyItems: "center",
    alignItems: "center",
    "& [data-piece-id]": {
        width: "auto",
        height: "auto",
        minHeight: 0
    }
}));

const meta: Meta = {
    title: "Game/Icon Template",
    parameters: { layout: "centered" }
};
export default meta;

/** Reference scene for designing the game icon: Jan 1 board with all pieces packed below. */
export const BoardWithAllPieces: StoryObj = {
    name: "Board + All Pieces (Jan 1)",
    render: () => (
        <Scene>
            <Board
                board={makeMockBoard(JAN_1)}
                pieces={makeMockPieces()}
                onCellClick={noop}
                onPieceDrop={noop}
                draggedPieceId={null}
                onDragStart={noop}
                onDragEnd={noop}
            />
            <TightPiecesGrid>
                {makeMockPieces().map(piece => (
                    <Piece key={piece.id} piece={piece} onClick={noop} />
                ))}
            </TightPiecesGrid>
        </Scene>
    )
};
