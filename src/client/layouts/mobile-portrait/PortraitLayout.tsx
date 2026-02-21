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
import type { PieceId } from "../../../common/pieceData";
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
    const theme = useTheme();
    const game = useGameController();
    const [boardScale, setBoardScale] = useState(1);

    // Calculate board scale based on available space
    useEffect(() => {
        const updateScale = () => {
            const availableWidth = window.innerWidth - 16; // Subtract padding
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

    // Get unplaced pieces for the carousel
    const unplacedPieces = game.gameState.pieces.filter(piece => !piece.position);

    // Handle piece drop from @dnd-kit
    const handleDndPieceDrop = useCallback((position: Position, pieceId: PieceId) => {
        game.handlePieceDrop(position, { pieceId });
    }, [game]);

    // Handle piece removal (return to carousel)
    const handleDndPieceRemove = useCallback((pieceId: PieceId) => {
        game.handlePieceReturnToPile(pieceId);
    }, [game]);

    // Handle drag start
    const handleDndDragStart = useCallback((pieceId: number) => {
        game.setDraggedPieceId(pieceId);
    }, [game]);

    // Handle drag end
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
                    onAccept={() => game.handlePlayAnother(game.modals.playAnother.suggestedDate!)}
                    onDecline={game.modals.playAnother.close}
                />
            </PortraitContainer>
        </DndProvider>
    );
};
