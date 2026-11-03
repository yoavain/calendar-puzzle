import React from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Portal from "@mui/material/Portal";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import type { Theme } from "@mui/material/styles";
import type { PuzzleDate } from "../../common/types";
import { SOLVE_COPY } from "../copy/solveCopy";

interface SolvedTodayNoticeProps {
    open: boolean;
    nextDate: PuzzleDate | null;
    onPlay: (date: PuzzleDate) => void;
    onClose: () => void;
}

const AUTO_HIDE_MS = 8000;
const TOUCH_TARGET_PX = 44;

/** Tells a returning player that today is done, without blocking the board. */
export const SolvedTodayNotice: React.FC<SolvedTodayNoticeProps> = ({ open, nextDate, onPlay, onClose }) => (
    // A layout ancestor is taller than the window, and fixed positioning follows it
    // without the portal, which puts the bar below the visible area on desktop.
    <Portal>
        <Snackbar
            open={open}
            autoHideDuration={AUTO_HIDE_MS}
            onClose={(_, reason) => {
                if (reason !== "clickaway") {
                    onClose();
                }
            }}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            // Under the dialogs, so that a dialog's scrim covers the notice.
            sx={(theme: Theme) => ({ zIndex: theme.zIndex.modal - 1 })}
            slotProps={{ content: { role: "status", sx: { backgroundColor: "grey.900", color: "common.white" } } }}
            message={SOLVE_COPY.solvedTodayNotice}
            action={
                <>
                    {nextDate && (
                        <Button
                            size="small"
                            onClick={() => onPlay(nextDate)}
                            sx={(theme: Theme) => ({
                                color: theme.game.colors.snackbarAction,
                                "@media (pointer: coarse)": { minHeight: TOUCH_TARGET_PX }
                            })}
                        >
                            {SOLVE_COPY.playDate(nextDate)}
                        </Button>
                    )}
                    <IconButton
                        size="small"
                        aria-label="Close"
                        color="inherit"
                        onClick={onClose}
                        sx={{ "@media (pointer: coarse)": { width: TOUCH_TARGET_PX, height: TOUCH_TARGET_PX } }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </>
            }
        />
    </Portal>
);
