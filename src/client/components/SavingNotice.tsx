import React from "react";
import IconButton from "@mui/material/IconButton";
import Portal from "@mui/material/Portal";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import type { Theme } from "@mui/material/styles";
import { useUser } from "../context/UserContext";
import { SAVING_COPY } from "../copy/savingCopy";

const AUTO_HIDE_MS = 8000;
const TOUCH_TARGET_PX = 44;

/** What the player hears about saving. One instance serves every layout. */
export const SavingNotice: React.FC = () => {
    const { savingNotice, dismissSavingNotice } = useUser();

    return (
        // A layout ancestor is taller than the window, and fixed positioning follows it
        // without the portal, which puts the bar below the visible area on desktop.
        <Portal>
            <Snackbar
                key={savingNotice}
                open={savingNotice !== null}
                autoHideDuration={AUTO_HIDE_MS}
                onClose={(_, reason) => {
                    if (reason !== "clickaway") {
                        dismissSavingNotice();
                    }
                }}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                // Under the dialogs, so that a dialog's scrim covers the notice.
                sx={(theme: Theme) => ({ zIndex: theme.zIndex.modal - 1 })}
                slotProps={{ content: { role: "status", sx: { backgroundColor: "grey.900", color: "common.white" } } }}
                message={savingNotice && SAVING_COPY.notice[savingNotice]}
                action={
                    <IconButton
                        size="small"
                        aria-label="Close"
                        color="inherit"
                        onClick={dismissSavingNotice}
                        sx={{ "@media (pointer: coarse)": { width: TOUCH_TARGET_PX, height: TOUCH_TARGET_PX } }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
            />
        </Portal>
    );
};

/** Stays in the toolbar while saving is paused, and shows the notice again. */
export const SavingPausedButton: React.FC = () => {
    const { savingPaused, showSavingNotice } = useUser();

    if (!savingPaused) {
        return null;
    }

    return (
        <Tooltip title={SAVING_COPY.pausedIcon}>
            <IconButton size="small" aria-label={SAVING_COPY.pausedIcon} color="warning" onClick={() => showSavingNotice("paused")}>
                <CloudOffIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};
