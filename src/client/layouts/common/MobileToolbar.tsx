import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import type { ButtonProps } from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
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
import { SavingPausedButton } from "../../components/SavingNotice";
import { TooltipDisabledWrapper } from "../../components/TooltipDisabledWrapper";
import { SAVING_COPY } from "../../copy/savingCopy";
import { UserMenu } from "../../components/UserMenu";
import { DatePicker } from "../../components/DatePicker";
import { SolutionButton } from "../../components/SolutionButton";
import { HintButton } from "../../components/HintButton";
import { TokenMenuBadge } from "../../components/TokenMenuBadge";
import { LazyHallOfFameModal } from "../../components/lazyDialogs";
import { LazyShareDialog } from "../../components/LazyShareDialog";
import { FullSiteDialog } from "../../components/FullSiteDialog";
import { SIGN_IN_COPY } from "../../copy/signInCopy";
import { useIsEmbedded } from "../../context/EmbeddedContext";

import type { GameController } from "./useGameController";
import {
    ToolbarContainer,
    ToolbarLeft,
    ToolbarCenter,
    ToolbarRight,
    ToolbarActionButton,
    DrawerContent,
    DrawerHeader,
    DrawerSection,
    DrawerButton
} from "./MobileToolbar.styled";

// Shared sx for child components (DatePicker, SolutionButton, HintButton) in the drawer
const drawerButtonSx = {
    justifyContent: "flex-start",
    pl: 3,
    gap: 1.5
};

/** A drawer button that is disabled when it has a reason. A tap shows the reason. */
const ReasonedDrawerButton: React.FC<ButtonProps & { disabledReason: string }> = ({ disabledReason, ...props }) => {
    const [isReasonOpen, setIsReasonOpen] = useState(false);
    return (
        // The click opens the tooltip. In Chromium, a quick tap ends before the touch delay timer
        // fires, so the touch alone shows nothing.
        <Tooltip
            title={disabledReason}
            open={isReasonOpen}
            onOpen={() => setIsReasonOpen(true)}
            onClose={() => setIsReasonOpen(false)}
            enterTouchDelay={0}
        >
            <TooltipDisabledWrapper disabled={!!disabledReason} onClick={() => setIsReasonOpen(!!disabledReason)}>
                <DrawerButton fullWidth variant="outlined" {...props} disabled={!!disabledReason} />
            </TooltipDisabledWrapper>
        </Tooltip>
    );
};

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
 *
 * Hall of Fame, Stats, Bug Report and Hint need a signed-in player. In a frame on another site,
 * they open FullSiteDialog. Elsewhere, they are disabled.
 */
export const MobileToolbar: React.FC<MobileToolbarProps> = ({ game, orientation = "horizontal" }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
    const [debugEnabled, setDebugEnabled] = useState(() => debugLogger.isEnabled());
    const [isFullSiteOpen, setIsFullSiteOpen] = useState(false);
    const isEmbedded = useIsEmbedded();
    const offersFullSite = isEmbedded && !game.user;
    const needsSignIn = !isEmbedded && !game.user;
    const statsPaused = !offersFullSite && game.savingPaused;

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    // Close drawer after action
    const handleAction = (action: () => void) => {
        action();
        closeDrawer();
    };

    const handleSignedInAction = (action: () => void) =>
        handleAction(offersFullSite ? () => setIsFullSiteOpen(true) : action);

    return (
        <>
            <ToolbarContainer orientation={orientation}>
                <ToolbarLeft orientation={orientation}>
                    <ThemeToggle showIcons={false} />
                    {!game.userLoading && (game.user
                        // The paused icon takes the place of Hall of Fame, which the drawer also offers
                        ? <UserMenu onShowTokenIntro={game.modals.tokenIntro.open} hideHallOfFameButton={game.savingPaused} />
                        : <LoginButton />)}
                    <SavingPausedButton />
                </ToolbarLeft>

                <ToolbarCenter orientation={orientation}>
                    <ToolbarActionButton
                        onClick={game.undo}
                        disabled={!game.canUndo || game.gameState.isSolved}
                        aria-label="Undo"
                    >
                        <UndoIcon />
                    </ToolbarActionButton>
                    <ToolbarActionButton
                        onClick={game.redo}
                        disabled={!game.canRedo || game.gameState.isSolved}
                        aria-label="Redo"
                    >
                        <RedoIcon />
                    </ToolbarActionButton>
                    <ToolbarActionButton
                        onClick={game.handleReset}
                        disabled={game.isResetDisabled}
                        aria-label="Reset"
                        color="warning"
                    >
                        <RestartAltIcon />
                    </ToolbarActionButton>
                </ToolbarCenter>

                <ToolbarRight orientation={orientation}>
                    <ToolbarActionButton
                        onClick={openDrawer}
                        aria-label="Open menu"
                    >
                        <TokenMenuBadge tokenBalance={game.tokenBalance} invisible={!game.user || game.savingPaused}>
                            <MenuIcon />
                        </TokenMenuBadge>
                    </ToolbarActionButton>
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
                        <ReasonedDrawerButton
                            startIcon={<EmojiEventsIcon />}
                            onClick={() => handleSignedInAction(() => setIsHallOfFameOpen(true))}
                            disabledReason={needsSignIn ? SIGN_IN_COPY.hallOfFameTooltip : ""}
                        >
                            Hall of Fame
                        </ReasonedDrawerButton>
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
                            How to play
                        </DrawerButton>
                        <ReasonedDrawerButton
                            startIcon={<BarChartIcon />}
                            onClick={() => handleSignedInAction(game.modals.stats.open)}
                            disabledReason={needsSignIn ? SIGN_IN_COPY.statsTooltip : statsPaused ? SAVING_COPY.statsTooltip : ""}
                        >
                            Statistics
                        </ReasonedDrawerButton>
                        <ReasonedDrawerButton
                            startIcon={<BugReportIcon />}
                            onClick={() => handleSignedInAction(game.modals.issue.open)}
                            disabledReason={needsSignIn ? SIGN_IN_COPY.issueTooltip : ""}
                            color="info"
                        >
                            Report a bug
                        </ReasonedDrawerButton>
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
                            onSignInRequired={offersFullSite ? () => handleAction(() => setIsFullSiteOpen(true)) : undefined}
                            availability={game.hintAvailability}
                            tokenBalance={game.tokenBalance}
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
            <LazyHallOfFameModal
                open={isHallOfFameOpen}
                onClose={() => setIsHallOfFameOpen(false)}
            />

            {isEmbedded && <FullSiteDialog open={isFullSiteOpen} onClose={() => setIsFullSiteOpen(false)} />}

            {/* Share Modal */}
            <LazyShareDialog open={game.modals.share.isOpen} onClose={game.modals.share.close} />
        </>
    );
};
