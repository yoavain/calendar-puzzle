import React, { useCallback } from "react";

import { MobileBoard } from "../../components/MobileBoard";
import { StatsModal } from "../../components/StatsModal";
import { IssueModal } from "../../components/IssueModal";
import { HelpModal } from "../../components/HelpModal";
import { PlayAnotherDialog } from "../../components/PlayAnotherDialog";
import { YearCompleteDialog } from "../../components/YearCompleteDialog";
import { TokenFlight } from "../../components/TokenFlight";
import { HintErrorToast } from "../../components/HintErrorToast";
import { TokenIntroDialog } from "../../components/TokenIntroDialog";
import { TokenConfirmDialog } from "../../components/TokenConfirmDialog";
import { PlacementProgressBar } from "../../components/PlacementProgressBar";

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
                <YearCompleteDialog
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
                <TokenIntroDialog
                    open={game.modals.tokenIntro.isOpen}
                    tokenBalance={game.tokenBalance}
                    solvedCount={game.completedDates.length}
                    onClose={game.modals.tokenIntro.close}
                />
                <TokenConfirmDialog
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
