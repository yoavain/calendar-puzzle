import React, { useEffect, useRef, useState } from "react";
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
import { PlacementProgressBar } from "../../components/PlacementProgressBar";
import { GoalHint } from "../../components/GoalHint";
import { HelpModal } from "../../components/HelpModal";
import { SolvedTodayNotice } from "../../components/SolvedTodayNotice";
import { YearCompleteDialog } from "../../components/YearCompleteDialog";
import { TokenFlight } from "../../components/TokenFlight";
import { HintErrorToast } from "../../components/HintErrorToast";
import { TokenIntroDialog } from "../../components/TokenIntroDialog";
import { TokenConfirmDialog } from "../../components/TokenConfirmDialog";
import { ShareDialog } from "../../components/ShareDialog";
import { TooltipDisabledWrapper } from "../../components/TooltipDisabledWrapper";
import { ToolbarIconButton } from "../../components/ToolbarIconButton";
import calendarImg from "../../assets/CALENDAR.png";
import puzzleImg from "../../assets/PUZZLE.png";

import { useGameController } from "../common/useGameController";
import {
    AppWrapper,
    ScaleContainer,
    ToolbarContainer,
    ToolbarGroups,
    ToolbarGroup,
    UndoRedoPair,
    toolbarButtonSx,
    toolbarActionSx,
    toolbarInfoSx,
    toolbarResetSx,
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
 * - Top toolbar with all controls, always at full size
 * - Board in the center
 * - 4x2 pieces grid below the board
 *
 * Uses viewport-based scaling to fit the game area below the toolbar.
 */
export const DesktopLayout: React.FC = () => {
    const game = useGameController();

    // Responsive scaling logic
    const [scale, setScale] = useState(1);
    const [isBelowMinHeight, setIsBelowMinHeight] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let isMounted = true;

        const calculateScale = () => {
            if (!isMounted) {
                return;
            }
            const widthScale = window.innerWidth / BASELINE_SIZE;
            const toolbarHeight = toolbarRef.current?.offsetHeight ?? 0;
            const heightScale = (Math.max(window.innerHeight, MIN_HEIGHT) - toolbarHeight) / BASELINE_HEIGHT;
            setScale(Math.min(widthScale, heightScale));
            setIsBelowMinHeight(window.innerHeight < MIN_HEIGHT);
        };

        calculateScale();
        window.addEventListener("resize", calculateScale);
        // The toolbar grows when it wraps or shows the solver error.
        const toolbarObserver = new ResizeObserver(calculateScale);
        if (toolbarRef.current) {
            toolbarObserver.observe(toolbarRef.current);
        }
        return () => {
            isMounted = false;
            window.removeEventListener("resize", calculateScale);
            toolbarObserver.disconnect();
        };
    }, []);

    return (
        <AppWrapper 
            onDragOver={game.handleGlobalDragOver}
            onDrop={game.handleGlobalDrop}
            sx={{ overflowY: isBelowMinHeight ? "auto" : "hidden" }}
        >
            <Box sx={{ width: "100%", height: isBelowMinHeight ? "auto" : "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ToolbarContainer ref={toolbarRef} maxWidth="lg">
                    {/* Top Bar */}
                    <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between", alignItems: "center", gap: 2 }}
                    >
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                            <ThemeToggle />
                            {!game.userLoading && (game.user ? <UserMenu onShowTokenIntro={game.modals.tokenIntro.open} /> : <LoginButton />)}
                        </Stack>
                        <ToolbarGroups>
                            {game.solverError && (
                                <Alert severity="error" sx={{ py: 0 }}>
                                    {game.solverError}
                                </Alert>
                            )}
                            <ToolbarGroup>
                                <ToolbarIconButton
                                    tooltip="How to play"
                                    onClick={game.modals.help.open}
                                    icon={<HelpOutlineIcon />}
                                    ariaLabel="How to play"
                                    sx={toolbarInfoSx}
                                />
                                <ToolbarIconButton
                                    tooltip={!game.user ? "Sign-in to submit a bug or request a feature" : "Submit bug / Request Feature"}
                                    onClick={game.modals.issue.open}
                                    icon={<BugReportIcon />}
                                    ariaLabel="Submit bug or request feature"
                                    disabled={!game.user}
                                    sx={toolbarInfoSx}
                                />
                                <ToolbarIconButton
                                    tooltip={!game.user ? "Sign-in to see statistics" : "Statistics"}
                                    onClick={game.modals.stats.open}
                                    icon={<BarChartIcon />}
                                    ariaLabel="Statistics"
                                    disabled={!game.user}
                                    sx={toolbarInfoSx}
                                />
                                <ToolbarIconButton
                                    tooltip="Share"
                                    onClick={game.modals.share.open}
                                    icon={<ShareIcon />}
                                    ariaLabel="Share"
                                    sx={toolbarInfoSx}
                                />
                            </ToolbarGroup>
                            <ToolbarGroup>
                                <DatePicker currentDate={game.gameState.currentDate} onDateChange={game.handleDateChange} sx={toolbarButtonSx} />
                                <HintButton
                                    onHint={() => {
                                        game.handleHint().catch(() => {});
                                    }}
                                    availability={game.hintAvailability}
                                    tokenBalance={game.tokenBalance}
                                    color="primary"
                                    sx={toolbarActionSx}
                                />
                                <SolutionButton
                                    onSolve={() => {
                                        game.handleSolve().catch(() => {});
                                    }}
                                    isLoading={game.isLoading}
                                    disabled={game.gameState.isSolved}
                                    sx={toolbarButtonSx}
                                />
                            </ToolbarGroup>
                            <ToolbarGroup>
                                <UndoRedoPair>
                                    <Tooltip title="Ctrl+Z" arrow>
                                        <TooltipDisabledWrapper disabled={!game.canUndo || game.gameState.isSolved}>
                                            <Button
                                                variant="contained"
                                                onClick={game.undo}
                                                disabled={!game.canUndo || game.gameState.isSolved}
                                                size="small"
                                                startIcon={<UndoIcon />}
                                                sx={toolbarActionSx}
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
                                                sx={toolbarActionSx}
                                            >
                                                Redo
                                            </Button>
                                        </TooltipDisabledWrapper>
                                    </Tooltip>
                                </UndoRedoPair>
                                <Tooltip title="Clear the board" arrow>
                                    <TooltipDisabledWrapper disabled={game.isResetDisabled}>
                                        <Button
                                            variant="contained"
                                            onClick={game.handleReset}
                                            disabled={game.isResetDisabled}
                                            size="small"
                                            startIcon={<RestartAltIcon />}
                                            sx={toolbarResetSx}
                                        >
                                            Reset
                                        </Button>
                                    </TooltipDisabledWrapper>
                                </Tooltip>
                            </ToolbarGroup>
                        </ToolbarGroups>
                    </Stack>
                    <GoalHint placedCount={game.placementOrder.length} sx={{ typography: "body1", fontWeight: 500, pt: 1.5, pb: 0 }} />
                </ToolbarContainer>
                <ScaleContainer scale={scale}>
                    <Container 
                        maxWidth="lg" 
                        sx={{ pb: 2 }}
                    >
                        {/* Title */}
                        <GameTitle 
                            variant="h4" 
                            component="h1" 
                            align="center" 
                        >
                            <img src={calendarImg} alt="Calendar" />
                            <img src={puzzleImg} alt="Puzzle" />
                        </GameTitle>

                        {/* Progress Bar */}
                        <PlacementProgressBar order={game.placementOrder} />

                        {/* Statistics Modal */}
                        <StatsModal
                            open={game.modals.stats.isOpen}
                            onClose={game.modals.stats.close}
                            solveResult={game.modals.stats.solveResult}
                            onPlayNext={game.handlePlayNext}
                        />

                        {/* Issue Modal */}
                        <IssueModal open={game.modals.issue.isOpen} onClose={game.modals.issue.close} />

                        {/* Help Modal */}
                        <HelpModal open={game.modals.help.isOpen} onClose={game.modals.help.close} />

                        {/* Share Modal */}
                        <ShareDialog open={game.modals.share.isOpen} onClose={game.modals.share.close} />

                        {/* Year Complete Dialog */}
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
                        <TokenConfirmDialog
                            open={game.modals.tokenConfirm.isOpen}
                            tokenBalance={game.tokenBalance}
                            onConfirm={(dontAskAgain) => {
                                game.handleConfirmTokenHint(dontAskAgain).catch(() => {});
                            }}
                            onCancel={game.modals.tokenConfirm.close}
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
