import React from "react";
import { initializeBoard } from "../../../common/initialize";
import { toPuzzleDate } from "../../../common/types";
import { BoardContainer, BoardRow, BoardCell, StyledCellText } from "../Board.styled";

const HIGHLIGHT_COLOR = "#ffeb3b";
const DEPTH = 12;

/** Box-shadow extrusion for highlighted (yellow) cells. */
const highlightShadow = Array.from({ length: DEPTH }, (_, i) => {
    const n = i + 1;
    return `${n}px ${n}px 0 #b8a200`;
}).join(", ");

/** Inset shadow to make labeled cells look recessed into the board surface. */
const insetShadow = "inset 2px 2px 6px rgba(0,0,0,0.6), inset -1px -1px 3px rgba(255,255,255,0.04)";

/**
 * Non-interactive board rendering for the landing page.
 * Shows today's date highlighted on the board with 3D depth.
 */
export const StaticBoard: React.FC = () => {
    const puzzleDate = toPuzzleDate(new Date());
    const board = initializeBoard(puzzleDate);

    return (
        <BoardContainer
            sx={{
                pointerEvents: "none",
                position: "relative",
                transformStyle: "preserve-3d"
            }}
        >
            {board.map((row, y) => (
                <BoardRow key={y}>
                    {row.map((cell, x) => {
                        const isHidden = !cell.isPlayable && !cell.content;
                        return (
                            <BoardCell
                                key={`${y}-${x}`}
                                isPlayable={cell.isPlayable}
                                isHighlighted={cell.isHighlighted}
                                isHidden={isHidden}
                                isStyled={!!cell.content}
                                isSolved={true}
                                sx={cell.isHighlighted ? {
                                    position: "relative",
                                    zIndex: 2,
                                    backgroundColor: `${HIGHLIGHT_COLOR} !important`,
                                    boxShadow: highlightShadow,
                                    transform: `translate(-${DEPTH}px, -${DEPTH}px)`
                                } : (cell.isPlayable ? {
                                    boxShadow: insetShadow
                                } : undefined)}
                            >
                                {cell.content && (
                                    <StyledCellText>{cell.content}</StyledCellText>
                                )}
                            </BoardCell>
                        );
                    })}
                </BoardRow>
            ))}
        </BoardContainer>
    );
};
