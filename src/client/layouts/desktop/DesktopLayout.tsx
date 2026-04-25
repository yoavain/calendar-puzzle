import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import BugReportIcon from "@mui/icons-material/BugReport";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShareIcon from "@mui/icons-material/Share";

import { Board as BoardComponent } from "../../components/Board";
import { Piece } from "../../components/Piece";
import { PieceControls } from "../../components/PieceControls";
import ThemeToggle from "../../components/ThemeToggle";
import { SolutionButton } from "../../components/SolutionButton";
import { HintButton } from "../../components/HintButton";
import { LoginButton } from "../../components/LoginButton";
import { UserMenu } from "../../components/UserMenu";
import { DatePicker } from "../../components/DatePicker";
import { StatsModal } from "../../components/StatsModal";
import { IssueModal } from "../../components/IssueModal";
import { ProgressBar } from "../../components/ProgressBar";
import { HelpModal } from "../../components/HelpModal";
import { PlayAnotherDialog } from "../../components/PlayAnotherDialog";
import { ShareDialog } from "../../components/ShareDialog";
import { TooltipDisabledWrapper } from "../../components/TooltipDisabledWrapper";

import { useGameController } from "../common/useGameController";
import {
    AppWrapper,
    ScaleContainer,
    GameTitle,
    PiecesContainer,
    PiecePoolWrapper,
    BASELINE_SIZE,
    BASELINE_HEIGHT,
    MIN_HEIGHT
} from "./DesktopLayout.styled";

/**
 * Desktop layout component.
 * 
 * Renders the game with:
 * - Top toolbar with all controls
 * - Board in the center
 * - 4x2 pieces grid below the board
 * 
 * Uses viewport-based scaling to fit different screen sizes.
 */
export const DesktopLayout: React.FC = () => {
    const game = useGameController();

    // Responsive scaling logic
    const [scale, setScale] = useState(1);
    const [isBelowMinHeight, setIsBelowMinHeight] = useState(false);
    useEffect(() => {
        let isMounted = true;

        const calculateScale = () => {
            if (!isMounted) {
                return;
            }
            const widthScale = window.innerWidth / BASELINE_SIZE;
            const heightScale = Math.max(window.innerHeight, MIN_HEIGHT) / BASELINE_HEIGHT;
            setScale(Math.min(widthScale, heightScale));
            setIsBelowMinHeight(window.innerHeight < MIN_HEIGHT);
        };

        calculateScale();
        window.addEventListener("resize", calculateScale);
        return () => {
            isMounted = false;
            window.removeEventListener("resize", calculateScale);
        };
    }, []);

    return (
        <AppWrapper 
            onDragOver={game.handleGlobalDragOver}
            onDrop={game.handleGlobalDrop}
            sx={{ overflowY: isBelowMinHeight ? "auto" : "hidden" }}
        >
            <Box sx={{ width: "100%", height: isBelowMinHeight ? "auto" : "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ScaleContainer scale={scale}>
                    <Container 
                        maxWidth="lg" 
                        sx={{ py: 2 }}
                    >
                        {/* Top Bar */}
                        <Stack
                            direction="row"
                            sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}
                        >
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                <ThemeToggle />
                                {!game.userLoading && (game.user ? <UserMenu /> : <LoginButton />)}
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                                {game.solverError && (
                                    <Alert severity="error" sx={{ py: 0 }}>
                                        {game.solverError}
                                    </Alert>
                                )}
                                <SolutionButton onSolve={game.handleSolve} isLoading={game.isLoading} disabled={game.gameState.isSolved} />
                                <Tooltip title="How to play" arrow>
                                    <TooltipDisabledWrapper>
                                        <Button
                                            variant="contained"
                                            onClick={game.modals.help.open}
                                            size="small"
                                            sx={{ minWidth: 40, px: 1 }}
                                            color="secondary"
                                            aria-label="How to play"
                                        >
                                            <HelpOutlineIcon />
                                        </Button>
                                    </TooltipDisabledWrapper>
                                </Tooltip>
                                <Tooltip title={!game.user ? "Sign-in to submit a bug or request a feature" : "Submit bug / Request Feature"} arrow>
                                    <TooltipDisabledWrapper disabled={!game.user}>
                                        <Button
                                            variant="contained"
                                            onClick={game.modals.issue.open}
                                            size="small"
                                            sx={{ minWidth: 40, px: 1 }}
                                            disabled={!game.user}
                                            color="info"
                                            aria-label="Submit bug or request feature"
                                        >
                                            <BugReportIcon />
                                        </Button>
                                    </TooltipDisabledWrapper>
                                </Tooltip>
                                <Tooltip title={!game.user ? "Sign-in to see statistics" : "Statistics"} arrow>
                                    <TooltipDisabledWrapper disabled={!game.user}>
                                        <Button
                                            variant="contained"
                                            onClick={game.modals.stats.open}
                                            size="small"
                                            sx={{ minWidth: 40, px: 1 }}
                                            disabled={!game.user}
                                            aria-label="Statistics"
                                        >
                                            <BarChartIcon />
                                        </Button>
                                    </TooltipDisabledWrapper>
                                </Tooltip>
                                <Tooltip title="Share" arrow>
                                    <TooltipDisabledWrapper>
                                        <Button
                                            variant="contained"
                                            onClick={game.modals.share.open}
                                            size="small"
                                            sx={{ minWidth: 40, px: 1 }}
                                            color="secondary"
                                            aria-label="Share"
                                        >
                                            <ShareIcon />
                                        </Button>
                                    </TooltipDisabledWrapper>
                                </Tooltip>
                                <DatePicker currentDate={game.gameState.currentDate} onDateChange={game.handleDateChange} />
                                <HintButton onHint={game.handleHint} isLoading={game.isHintLoading} disabled={!game.isBoardEmpty || game.gameState.isSolved} />
                                <Tooltip title="Ctrl+Z" arrow>
                                    <TooltipDisabledWrapper disabled={!game.canUndo || game.gameState.isSolved}>
                                        <Button
                                            variant="contained"
                                            onClick={game.undo}
                                            disabled={!game.canUndo || game.gameState.isSolved}
                                            size="small"
                                            startIcon={<UndoIcon />}
                                        >
                                        Undo
                                        </Button>
                                    </TooltipDisabledWrapper>
                                </Tooltip>
                                <Tooltip title="Ctrl+Y or Ctrl+Shift+Z" arrow>
                                    <TooltipDisabledWrapper disabled={!game.canRedo || game.gameState.isSolved}>
                                        <Button
                                            variant="contained"
                                            onClick={game.redo}
                                            disabled={!game.canRedo || game.gameState.isSolved}
                                            size="small"
                                            startIcon={<RedoIcon />}
                                        >
                                        Redo
                                        </Button>
                                    </TooltipDisabledWrapper>
                                </Tooltip>
                                <Tooltip title="Esc" arrow>
                                    <TooltipDisabledWrapper disabled={game.isResetDisabled}>
                                        <Button
                                            variant="outlined"
                                            onClick={game.handleReset}
                                            disabled={game.isResetDisabled}
                                            size="small"
                                            startIcon={<RestartAltIcon />}
                                            color="warning"
                                        >
                                        Reset
                                        </Button>
                                    </TooltipDisabledWrapper>
                                </Tooltip>
                            </Stack>
                        </Stack>

                        {/* Title */}
                        <GameTitle 
                            variant="h4" 
                            component="h1" 
                            align="center" 
                        >
                        Calendar Puzzle
                        </GameTitle>

                        {/* Progress Bar */}
                        <ProgressBar {...game.calculateProgress()} />

                        {/* Statistics Modal */}
                        <StatsModal open={game.modals.stats.isOpen} onClose={game.modals.stats.close} />

                        {/* Issue Modal */}
                        <IssueModal open={game.modals.issue.isOpen} onClose={game.modals.issue.close} />

                        {/* Help Modal */}
                        <HelpModal open={game.modals.help.isOpen} onClose={game.modals.help.close} />

                        {/* Share Modal */}
                        <ShareDialog open={game.modals.share.isOpen} onClose={game.modals.share.close} />

                        {/* Play Another Dialog */}
                        <PlayAnotherDialog
                            isOpen={game.modals.playAnother.isOpen}
                            mode={game.modals.playAnother.mode}
                            onAccept={() => game.handlePlayAnother(game.modals.playAnother.suggestedDate)}
                            onDecline={game.modals.playAnother.close}
                        />

                        {/* Game Area */}
                        <Box component="main">
                            <BoardComponent
                                board={game.gameState.board}
                                pieces={game.gameState.pieces}
                                onCellClick={game.handleCellClick}
                                onPieceDrop={game.handlePieceDrop}
                                invalidDropCells={game.invalidDropCells}
                                solutionRevealed={game.gameState.solutionRevealed}
                                isSolved={game.gameState.isSolved}
                                draggedPieceId={game.draggedPieceId}
                                onDragStart={game.setDraggedPieceId}
                                onDragEnd={game.handleDragEnd}
                                selectedPieceId={game.gameState.selectedPieceId}
                            />
                            <PiecesContainer
                                onDragOver={!game.gameState.isSolved ? game.handlePileDropZoneDragOver : undefined}
                                onDrop={!game.gameState.isSolved ? game.handlePileDropZoneDrop : undefined}
                            >
                                {game.gameState.pieces
                                    .filter(piece => !piece.position)
                                    .map(piece => (
                                        <PiecePoolWrapper key={piece.id}>
                                            <Piece
                                                piece={piece}
                                                onClick={() => game.handlePieceSelect(piece.id)}
                                                onDragStart={game.setDraggedPieceId}
                                                onDragEnd={game.handleDragEnd}
                                                keyboardSelectable
                                                isSelected={game.gameState.selectedPieceId === piece.id}
                                            />
                                            <PieceControls
                                                piece={piece}
                                                onRotate={() => game.handleRotatePiece(piece.id)}
                                                onRotateCCW={() => game.handleRotateCCWPiece(piece.id)}
                                                onFlipH={() => game.handleFlipHPiece(piece.id)}
                                                onFlipV={() => game.handleFlipVPiece(piece.id)}
                                            />
                                        </PiecePoolWrapper>
                                    ))}
                            </PiecesContainer>
                        </Box>
                    </Container>
                </ScaleContainer>
            </Box>
        </AppWrapper>
    );
};
