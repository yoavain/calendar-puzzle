import React from "react";
import { initializeBoard } from "../../utils/initialize";
import { toPuzzleDate } from "../../../common/types";
import { BoardContainer, BoardRow, BoardCell, StyledCellText } from "../Board.styled";

/**
 * Non-interactive board rendering for the landing page.
 * Shows today's date highlighted on the board.
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
