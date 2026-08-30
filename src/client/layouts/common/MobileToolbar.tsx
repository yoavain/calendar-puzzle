import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import BugReportIcon from "@mui/icons-material/BugReport";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ShareIcon from "@mui/icons-material/Share";
import DeveloperModeIcon from "@mui/icons-material/DeveloperMode";
import { debugLogger } from "../../utils/debugLogger";

import ThemeToggle from "../../components/ThemeToggle";
import { LoginButton } from "../../components/LoginButton";
import { UserMenu } from "../../components/UserMenu";
import { DatePicker } from "../../components/DatePicker";
import { SolutionButton } from "../../components/SolutionButton";
import { HintButton } from "../../components/HintButton";
import { HallOfFameModal } from "../../components/HallOfFameModal";
import { ShareDialog } from "../../components/ShareDialog";

import type { GameController } from "./useGameController";
import {
    ToolbarContainer,
    ToolbarLeft,
    ToolbarCenter,
    ToolbarRight,
    DrawerContent,
    DrawerHeader,
    DrawerSection,
    DrawerButton
} from "./MobileToolbar.styled";

interface MobileToolbarProps {
    game: GameController;
    /** Layout direction: horizontal (default) for portrait top bar, vertical for landscape left strip. */
    orientation?: "horizontal" | "vertical";
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
export const MobileToolbar: React.FC<MobileToolbarProps> = ({ game, orientation = "horizontal" }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
    const [debugEnabled, setDebugEnabled] = useState(debugLogger.isEnabled());

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    // Close drawer after action
    const handleAction = (action: () => void) => {
        action();
        closeDrawer();
    };

    // Shared sx for child components (DatePicker, SolutionButton, HintButton) in the drawer
    const drawerButtonSx = {
        justifyContent: "flex-start",
        pl: 3,
        gap: 1.5
    };

    return (
        <>
            <ToolbarContainer orientation={orientation}>
                <ToolbarLeft orientation={orientation}>
                    <ThemeToggle />
                    {!game.userLoading && (game.user ? <UserMenu /> : <LoginButton />)}
                </ToolbarLeft>

                <ToolbarCenter orientation={orientation}>
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

                <ToolbarRight orientation={orientation}>
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
                        <DatePicker
                            currentDate={game.gameState.currentDate}
                            onDateChange={(date) => handleAction(() => game.handleDateChange(date))}
                            fullWidth
                            sx={drawerButtonSx}
                        />
                        <DrawerButton
                            fullWidth
                            variant="outlined"
                            startIcon={<EmojiEventsIcon />}
                            onClick={() => handleAction(() => setIsHallOfFameOpen(true))}
                        >
                            Hall of Fame
                        </DrawerButton>
                    </DrawerSection>

                    <Divider />

                    {/* Help & Info Section */}
                    <DrawerSection>
                        <DrawerButton
                            fullWidth
                            variant="outlined"
                            startIcon={<HelpOutlineIcon />}
                            onClick={() => handleAction(game.modals.help.open)}
                            color="secondary"
                        >
                            How to Play
                        </DrawerButton>
                        <DrawerButton
                            fullWidth
                            variant="outlined"
                            startIcon={<BarChartIcon />}
                            onClick={() => handleAction(game.modals.stats.open)}
                            disabled={!game.user}
                        >
                            Statistics
                        </DrawerButton>
                        <DrawerButton
                            fullWidth
                            variant="outlined"
                            startIcon={<BugReportIcon />}
                            onClick={() => handleAction(game.modals.issue.open)}
                            disabled={!game.user}
                            color="info"
                        >
                            Report Bug
                        </DrawerButton>
                        <DrawerButton
                            fullWidth
                            variant="outlined"
                            startIcon={<ShareIcon />}
                            onClick={() => handleAction(game.modals.share.open)}
                            color="secondary"
                        >
                            Share
                        </DrawerButton>
                    </DrawerSection>

                    <Divider />

                    {/* Solver Section */}
                    <DrawerSection>
                        <SolutionButton
                            onSolve={() => handleAction(() => {
                                game.handleSolve().catch(() => {});
                            })}
                            isLoading={game.isLoading}
                            disabled={game.gameState.isSolved}
                            fullWidth
                            sx={drawerButtonSx}
                        />
                        <HintButton
                            onHint={() => handleAction(() => {
                                game.handleHint().catch(() => {});
                            })}
                            isLoading={game.isHintLoading}
                            disabled={!game.isBoardEmpty || game.gameState.isSolved}
                            fullWidth
                            sx={drawerButtonSx}
                        />
                    </DrawerSection>

                    {/* Dev Tools Section — admin only */}
                    {game.user?.isAdmin && (
                        <>
                            <Divider />
                            <DrawerSection>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={debugEnabled}
                                            onChange={(_, checked) => {
                                                debugLogger.setEnabled(checked);
                                                setDebugEnabled(checked);
                                            }}
                                            size="small"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <DeveloperModeIcon fontSize="small" />
                                            Debug Logging
                                        </Box>
                                    }
                                    sx={{ pl: 2 }}
                                />
                            </DrawerSection>
                        </>
                    )}
                </DrawerContent>
            </Drawer>

            {/* Hall of Fame Modal */}
            <HallOfFameModal
                open={isHallOfFameOpen}
                onClose={() => setIsHallOfFameOpen(false)}
            />

            {/* Share Modal */}
            <ShareDialog open={game.modals.share.isOpen} onClose={game.modals.share.close} />
        </>
    );
};
