import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Board } from "./Board";
import { makeMockBoard, makeMockPieces, STORY_DATE, JAN_1 } from "../storybook/mockData";
import { updateBoardAndPieces } from "../../common/boardOperations";
import { findSolution } from "../../common/puzzleSolver";
import { initializeBoard, initializePieces } from "../../common/initialize";

const noop = () => {};

// Pre-compute solved state once at module load (synchronous DLX solve for Jan 1)
const solvedState = (() => {
    const board = initializeBoard(JAN_1);
    const pieces = initializePieces();
    return findSolution(board, pieces, JAN_1);
})();

const meta: Meta<typeof Board> = {
    title: "Game/Board",
    component: Board,
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof Board>;

export const Empty: Story = {
    render: () => (
        <Board
            board={makeMockBoard()}
            pieces={makeMockPieces()}
            onCellClick={noop}
            onPieceDrop={noop}
            draggedPieceId={null}
            onDragStart={noop}
            onDragEnd={noop}
        />
    )
};

export const WithPiecesPlaced: Story = {
    render: () => {
        const allPieces = makeMockPieces();
        const board = makeMockBoard();
        const piece1 = allPieces[0];
        const piece2 = allPieces[1];
        const { board: b1, pieces: p1 } = updateBoardAndPieces(piece1, { x: 0, y: 2 }, board, allPieces);
        const { board: b2, pieces: p2 } = updateBoardAndPieces(piece2, { x: 3, y: 2 }, b1, p1);
        return (
            <Board
                board={b2}
                pieces={p2}
                onCellClick={noop}
                onPieceDrop={noop}
                draggedPieceId={null}
                onDragStart={noop}
                onDragEnd={noop}
            />
        );
    }
};

export const Solved: Story = {
    render: () => {
        if (!solvedState) {
            return <div>Solver failed to find a solution for Jan 1</div>;
        }
        return (
            <Board
                board={solvedState.board}
                pieces={solvedState.pieces}
                onCellClick={noop}
                onPieceDrop={noop}
                draggedPieceId={null}
                onDragStart={noop}
                onDragEnd={noop}
                isSolved={true}
            />
        );
    }
};

const SolvedCelebrationStory = () => {
    const [isSolved, setIsSolved] = useState(false);
    if (!solvedState) {
        return <div>Solver failed to find a solution for Jan 1</div>;
    }
    const replay = () => {
        setIsSolved(false);
        window.setTimeout(() => setIsSolved(true), 0);
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Board
                board={solvedState.board}
                pieces={solvedState.pieces}
                onCellClick={noop}
                onPieceDrop={noop}
                draggedPieceId={null}
                onDragStart={noop}
                onDragEnd={noop}
                isSolved={isSolved}
            />
            <button onClick={replay} style={{ padding: "8px 20px", cursor: "pointer", fontSize: 14 }}>
                {isSolved ? "Replay" : "Trigger win"}
            </button>
        </div>
    );
};

export const SolvedCelebration: Story = {
    name: "Solved — Win Celebration",
    render: () => <SolvedCelebrationStory />
};

// Places the Jan 1 solution one piece per click, so each click plays the
// landing animation. The last click solves the board and plays the win sweep.
const PieceLandingStory = () => {
    const [placed, setPlaced] = useState(0);
    if (!solvedState) {
        return <div>Solver failed to find a solution for Jan 1</div>;
    }
    const solution = solvedState.pieces;
    const pieces = initializePieces().map(p => {
        const index = solution.findIndex(s => s.id === p.id);
        return index < placed ? solution[index] : p;
    });
    const isSolved = placed >= solution.length;
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Board
                board={isSolved ? solvedState.board : initializeBoard(JAN_1)}
                pieces={pieces}
                onCellClick={noop}
                onPieceDrop={noop}
                draggedPieceId={null}
                onDragStart={noop}
                onDragEnd={noop}
                isSolved={isSolved}
            />
            <button
                onClick={() => setPlaced(isSolved ? 0 : placed + 1)}
                style={{ padding: "8px 20px", cursor: "pointer", fontSize: 14 }}
            >
                {isSolved ? "Clear board" : `Place piece ${placed + 1} of ${solution.length}`}
            </button>
        </div>
    );
};

export const PieceLanding: Story = {
    name: "Piece Landing",
    render: () => <PieceLandingStory />
};

export const TodayDate: Story = {
    name: "Feb 20 (Today)",
    render: () => (
        <Board
            board={makeMockBoard(STORY_DATE)}
            pieces={makeMockPieces()}
            onCellClick={noop}
            onPieceDrop={noop}
            draggedPieceId={null}
            onDragStart={noop}
            onDragEnd={noop}
        />
    )
};
