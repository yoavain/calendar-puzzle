import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import BugReportIcon from "@mui/icons-material/BugReport";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import ThemeToggle from "../../components/ThemeToggle";
import { LoginButton } from "../../components/LoginButton";
import { UserMenu } from "../../components/UserMenu";
import { DatePicker } from "../../components/DatePicker";
import { SolutionButton } from "../../components/SolutionButton";
import { HintButton } from "../../components/HintButton";
import { HallOfFameModal } from "../../components/HallOfFameModal";

import type { GameController } from "./useGameController";
import {
    ToolbarContainer,
    ToolbarLeft,
    ToolbarCenter,
    ToolbarRight,
    DrawerContent,
    DrawerHeader,
    DrawerSection,
    DrawerSectionTitle
} from "./MobileToolbar.styled";

interface MobileToolbarProps {
    game: GameController;
}

/**
 * Compact mobile toolbar with hamburger menu.
 * 
 * Visible controls:
 * - Theme toggle
 * - User menu / Login
 * - Undo / Redo / Reset (game actions)
 * - Hamburger menu
 * 
 * Hamburger menu contains:
 * - Date picker
 * - Hall of Fame
 * - Help, Stats, Bug Report
 * - Solution, Hint
 */
export const MobileToolbar: React.FC<MobileToolbarProps> = ({ game }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    // Close drawer after action
    const handleAction = (action: () => void) => {
        action();
        closeDrawer();
    };

    return (
        <>
            <ToolbarContainer>
                <ToolbarLeft>
                    <ThemeToggle />
                    {!game.userLoading && (game.user ? <UserMenu /> : <LoginButton />)}
                </ToolbarLeft>

                <ToolbarCenter>
                    <IconButton
                        onClick={game.undo}
                        disabled={!game.canUndo || game.gameState.isSolved}
                        aria-label="Undo"
                        size="small"
                    >
                        <UndoIcon />
                    </IconButton>
                    <IconButton
                        onClick={game.redo}
                        disabled={!game.canRedo || game.gameState.isSolved}
                        aria-label="Redo"
                        size="small"
                    >
                        <RedoIcon />
                    </IconButton>
                    <IconButton
                        onClick={game.handleReset}
                        disabled={game.isResetDisabled}
                        aria-label="Reset"
                        size="small"
                        color="warning"
                    >
                        <RestartAltIcon />
                    </IconButton>
                </ToolbarCenter>

                <ToolbarRight>
                    <IconButton
                        onClick={openDrawer}
                        aria-label="Open menu"
                        size="medium"
                    >
                        <MenuIcon />
                    </IconButton>
                </ToolbarRight>
            </ToolbarContainer>

            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={closeDrawer}
            >
                <DrawerContent>
                    <DrawerHeader>
                        <Typography variant="h6">Menu</Typography>
                        <IconButton onClick={closeDrawer} size="small" aria-label="Close menu">
                            <CloseIcon />
                        </IconButton>
                    </DrawerHeader>

                    {/* Date & Navigation Section */}
                    <DrawerSection>
                        <DrawerSectionTitle>Date</DrawerSectionTitle>
                        <DatePicker 
                            currentDate={game.gameState.currentDate} 
                            onDateChange={(date) => handleAction(() => game.handleDateChange(date))} 
                        />
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<EmojiEventsIcon />}
                            onClick={() => handleAction(() => setIsHallOfFameOpen(true))}
                        >
                            Hall of Fame
                        </Button>
                    </DrawerSection>

                    {/* Help & Info Section */}
                    <DrawerSection>
                        <DrawerSectionTitle>Help & Info</DrawerSectionTitle>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<HelpOutlineIcon />}
                            onClick={() => handleAction(game.modals.help.open)}
                            color="secondary"
                        >
                            How to Play
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<BarChartIcon />}
                            onClick={() => handleAction(game.modals.stats.open)}
                            disabled={!game.user}
                        >
                            Statistics
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<BugReportIcon />}
                            onClick={() => handleAction(game.modals.issue.open)}
                            disabled={!game.user}
                            color="info"
                        >
                            Report Bug
                        </Button>
                    </DrawerSection>

                    {/* Solver Section */}
                    <DrawerSection>
                        <DrawerSectionTitle>Puzzle Helpers</DrawerSectionTitle>
                        <SolutionButton 
                            onSolve={() => handleAction(game.handleSolve)} 
                            isLoading={game.isLoading} 
                            disabled={game.gameState.isSolved} 
                        />
                        <HintButton 
                            onHint={() => handleAction(game.handleHint)} 
                            isLoading={game.isHintLoading} 
                            disabled={!game.isBoardEmpty || game.gameState.isSolved} 
                        />
                    </DrawerSection>
                </DrawerContent>
            </Drawer>

            {/* Hall of Fame Modal */}
            <HallOfFameModal 
                open={isHallOfFameOpen} 
                onClose={() => setIsHallOfFameOpen(false)} 
            />
        </>
    );
};
