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
    PortraitContainer,
    ContentArea,
    BoardArea,
    ProgressArea,
    getAvailableBoardHeight
} from "./PortraitLayout.styled";

/**
 * Mobile portrait layout component.
 * 
 * Structure:
 * - MobileToolbar at top (hamburger menu)
 * - ProgressBar below toolbar
 * - Board centered in middle (with @dnd-kit drop support)
 * - PieceCarousel at bottom (with @dnd-kit drag support)
 * 
 * Uses DndProvider for touch-compatible drag-and-drop.
 */
export const PortraitLayout: React.FC = () => {
    const game = useGameController();
    const { handleDndPieceDrop, handleDndPieceRemove, handleDndDragStart, handleDndDragEnd } = useDndAdapters(game);
    const getWidth = useCallback((w: number) => w - 16, []); // Subtract padding
    const getHeight = useCallback((h: number) => getAvailableBoardHeight(h), []);
    const boardScale = useBoardScale(getWidth, getHeight);

    // Get unplaced pieces for the carousel
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
            <PortraitContainer>
                {/* Mobile Toolbar with Hamburger Menu */}
                <MobileToolbar game={game} />

                {/* Beta disclaimer - mobile layout only */}
                <BetaBanner />

                {/* Content Area - Progress + Board */}
                <ContentArea>
                    {/* Progress Bar */}
                    <ProgressArea>
                        <ProgressBar {...game.calculateProgress()} />
                    </ProgressArea>

                    {/* Board Area */}
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
                </ContentArea>

                {/* Piece Carousel at Bottom */}
                <PieceCarousel
                    pieces={unplacedPieces}
                    selectedPieceId={game.gameState.selectedPieceId}
                    onPieceSelect={game.handlePieceSelect}
                    onRotatePiece={game.handleRotatePiece}
                    onRotateCCWPiece={game.handleRotateCCWPiece}
                    onFlipHPiece={game.handleFlipHPiece}
                    onFlipVPiece={game.handleFlipVPiece}
                    boardScale={boardScale}
                />

                {/* Modals */}
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
            </PortraitContainer>
        </DndProvider>
    );
};
