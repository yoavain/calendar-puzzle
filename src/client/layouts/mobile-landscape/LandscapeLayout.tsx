import React, { useCallback } from "react";

import { MobileBoard } from "../../components/MobileBoard";
import { LazyStatsModal, LazyIssueModal, LazyHelpModal, LazyTokenConfirmDialog } from "../../components/lazyDialogs";
import { SolvedTodayNotice } from "../../components/SolvedTodayNotice";
import { LazyYearCompleteDialog } from "../../components/LazyYearCompleteDialog";
import { TokenFlight } from "../../components/TokenFlight";
import { HintErrorToast } from "../../components/HintErrorToast";
import { TokenIntroDialog } from "../../components/TokenIntroDialog";
import { PlacementProgressBar } from "../../components/PlacementProgressBar";
import { GoalHint } from "../../components/GoalHint";

import { useGameController } from "../common/useGameController";
import { useDndAdapters } from "../common/useDndAdapters";
import { useBoardScale } from "../common/useBoardScale";
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
                            <GoalHint placedCount={game.placementOrder.length} sx={{ pt: 0.5 }} />
                            <ProgressArea>
                                <PlacementProgressBar order={game.placementOrder} />
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

                <LazyStatsModal
                    open={game.modals.stats.isOpen}
                    onClose={game.modals.stats.close}
                    solveResult={game.modals.stats.solveResult}
                    onPlayNext={game.handlePlayNext}
                />
                <LazyIssueModal
                    open={game.modals.issue.isOpen}
                    onClose={game.modals.issue.close}
                />
                <LazyHelpModal
                    open={game.modals.help.isOpen}
                    onClose={game.modals.help.close}
                />
                <LazyYearCompleteDialog
                    isOpen={game.modals.yearComplete.isOpen}
                    onPlayRandom={game.handlePlayRandomDate}
                    onClose={game.modals.yearComplete.close}
                />
                <TokenFlight
                    pending={game.pendingTokenFlights}
                    notBefore={game.tokenFlightNotBefore}
                    onLanded={game.landTokenFlight}
                />
                <HintErrorToast message={game.hintMessage} onClose={game.clearHintMessage} />
                {/* It shares the toast's place on screen, so it gives way to a hint error. */}
                <SolvedTodayNotice
                    open={game.modals.solvedNotice.isOpen && game.hintMessage === null}
                    nextDate={game.modals.solvedNotice.nextDate}
                    onPlay={game.handlePlayNext}
                    onClose={game.modals.solvedNotice.close}
                />
                <TokenIntroDialog
                    open={game.modals.tokenIntro.isOpen}
                    tokenBalance={game.tokenBalance}
                    solvedCount={game.completedDates.length}
                    isFirstView={game.modals.tokenIntro.isFirstView}
                    onClose={game.modals.tokenIntro.close}
                />
                <LazyTokenConfirmDialog
                    open={game.modals.tokenConfirm.isOpen}
                    tokenBalance={game.tokenBalance}
                    onConfirm={(dontAskAgain) => {
                        game.handleConfirmTokenHint(dontAskAgain).catch(() => {});
                    }}
                    onCancel={game.modals.tokenConfirm.close}
                />
                <DebugPanel />
            </LandscapeContainer>
        </DndProvider>
    );
};
