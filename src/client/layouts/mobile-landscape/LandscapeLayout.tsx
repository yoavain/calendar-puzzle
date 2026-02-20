import React, { useCallback, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";

import { MobileBoard } from "../../components/MobileBoard";
import { SuccessMessage } from "../../components/SuccessMessage";
import { StatsModal } from "../../components/StatsModal";
import { IssueModal } from "../../components/IssueModal";
import { HelpModal } from "../../components/HelpModal";
import { PlayAnotherDialog } from "../../components/PlayAnotherDialog";
import { ProgressBar } from "../../components/ProgressBar";

import { useGameController } from "../common/useGameController";
import { BetaBanner } from "../common/BetaBanner";
import { MobileToolbar } from "../common/MobileToolbar";
import { PieceCarousel } from "../common/PieceCarousel";
import { DndProvider } from "../common/DndProvider";
import { BoardScaleWrapper, calculateBoardScale } from "../common/boardScale";
import type { Position } from "../../../common/types";
import {
    LandscapeContainer,
    ToolbarColumn,
    MainColumn,
    ContentRow,
    BoardColumn,
    CarouselColumn,
    BoardArea,
    ProgressArea,
    getAvailableBoardWidth,
    getAvailableBoardHeight
} from "./LandscapeLayout.styled";

/**
 * Mobile landscape layout component.
 *
 * Structure:
 * - Toolbar column (left): MobileToolbar (vertical)
 * - Main column: content row with board column (disclaimer, progress bar, board) | vertical PieceCarousel
 *
 * Uses DndProvider for touch-compatible drag-and-drop.
 */
export const LandscapeLayout: React.FC = () => {
    const theme = useTheme();
    const game = useGameController();
    const [boardScale, setBoardScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            const availableWidth = getAvailableBoardWidth(window.innerWidth);
            const availableHeight = getAvailableBoardHeight(window.innerHeight);
            const scale = calculateBoardScale(
                availableWidth,
                availableHeight,
                theme.game.cellSize
            );
            setBoardScale(scale);
        };

        updateScale();
        window.addEventListener("resize", updateScale);
        window.addEventListener("orientationchange", updateScale);

        return () => {
            window.removeEventListener("resize", updateScale);
            window.removeEventListener("orientationchange", updateScale);
        };
    }, [theme.game.cellSize]);

    const unplacedPieces = game.gameState.pieces.filter(piece => !piece.position);

    const handleDndPieceDrop = useCallback((position: Position, pieceId: number) => {
        game.handlePieceDrop(position, { pieceId });
    }, [game]);

    const handleDndPieceRemove = useCallback((pieceId: number) => {
        game.handlePieceReturnToPile(pieceId);
    }, [game]);

    const handleDndDragStart = useCallback((pieceId: number) => {
        game.setDraggedPieceId(pieceId);
    }, [game]);

    const handleDndDragEnd = useCallback(() => {
        game.setDraggedPieceId(null);
    }, [game]);

    return (
        <DndProvider
            pieces={game.gameState.pieces}
            onPieceDrop={handleDndPieceDrop}
            onPieceRemove={handleDndPieceRemove}
            onDragStart={handleDndDragStart}
            onDragEnd={handleDndDragEnd}
            boardScale={boardScale}
        >
            <LandscapeContainer>
                <ToolbarColumn>
                    <MobileToolbar game={game} orientation="vertical" />
                </ToolbarColumn>

                <MainColumn>
                    <ContentRow>
                        <BoardColumn>
                            <BetaBanner />
                            <ProgressArea>
                                <ProgressBar {...game.calculateProgress()} />
                            </ProgressArea>
                            <BoardArea>
                                <BoardScaleWrapper scale={boardScale}>
                                    <MobileBoard
                                        board={game.gameState.board}
                                        pieces={game.gameState.pieces}
                                        onCellClick={game.handleCellClick}
                                        invalidDropCells={game.invalidDropCells}
                                        solutionRevealed={game.gameState.solutionRevealed ?? false}
                                        isSolved={game.gameState.isSolved ?? false}
                                        scale={boardScale}
                                    />
                                </BoardScaleWrapper>
                            </BoardArea>
                        </BoardColumn>

                        <CarouselColumn>
                            <PieceCarousel
                                pieces={unplacedPieces}
                                selectedPieceId={game.gameState.selectedPieceId}
                                onPieceSelect={game.handlePieceSelect}
                                onRotatePiece={game.handleRotatePiece}
                                onRotateCCWPiece={game.handleRotateCCWPiece}
                                onFlipHPiece={game.handleFlipHPiece}
                                onFlipVPiece={game.handleFlipVPiece}
                                axis="y"
                                boardScale={boardScale}
                            />
                        </CarouselColumn>
                    </ContentRow>
                </MainColumn>

                <SuccessMessage
                    isVisible={game.modals.success.isOpen}
                    onClose={game.modals.success.close}
                />
                <StatsModal
                    open={game.modals.stats.isOpen}
                    onClose={game.modals.stats.close}
                />
                <IssueModal
                    open={game.modals.issue.isOpen}
                    onClose={game.modals.issue.close}
                />
                <HelpModal
                    open={game.modals.help.isOpen}
                    onClose={game.modals.help.close}
                />
                <PlayAnotherDialog
                    isOpen={game.modals.playAnother.isOpen}
                    mode={game.modals.playAnother.mode}
                    onAccept={() => game.handlePlayAnother(game.modals.playAnother.suggestedDate!)}
                    onDecline={game.modals.playAnother.close}
                />
            </LandscapeContainer>
        </DndProvider>
    );
};
