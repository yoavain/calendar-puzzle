import React, { useCallback } from "react";

import { MobileBoard } from "../../components/MobileBoard";
import { SuccessMessage } from "../../components/SuccessMessage";
import { StatsModal } from "../../components/StatsModal";
import { IssueModal } from "../../components/IssueModal";
import { HelpModal } from "../../components/HelpModal";
import { PlayAnotherDialog } from "../../components/PlayAnotherDialog";
import { ProgressBar } from "../../components/ProgressBar";

import { useGameController } from "../common/useGameController";
import { useDndAdapters } from "../common/useDndAdapters";
import { useBoardScale } from "../common/useBoardScale";
import { BetaBanner } from "../common/BetaBanner";
import { MobileToolbar } from "../common/MobileToolbar";
import { PieceCarousel } from "../common/PieceCarousel";
import { DndProvider } from "../common/DndProvider";
import { DebugPanel } from "../../components/DebugPanel";
import { BoardScaleWrapper } from "../common/boardScale";
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
    const game = useGameController();
    const { handleDndPieceDrop, handleDndPieceRemove, handleDndDragStart, handleDndDragEnd } = useDndAdapters(game);
    const getWidth = useCallback((w: number) => getAvailableBoardWidth(w), []);
    const getHeight = useCallback((h: number) => getAvailableBoardHeight(h), []);
    const boardScale = useBoardScale(getWidth, getHeight);

    const unplacedPieces = game.gameState.pieces.filter(piece => !piece.position);

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
                                        solutionRevealed={game.gameState.solutionRevealed}
                                        isSolved={game.gameState.isSolved}
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
                    onAccept={() => game.handlePlayAnother(game.modals.playAnother.suggestedDate)}
                    onDecline={game.modals.playAnother.close}
                />
                <DebugPanel />
            </LandscapeContainer>
        </DndProvider>
    );
};
