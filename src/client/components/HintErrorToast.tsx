import React from "react";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";

interface HintErrorToastProps {
    message: string | null;
    onClose: () => void;
}

const AUTO_HIDE_MS = 5000;

/** Hint errors, shown the same way in every layout. */
export const HintErrorToast: React.FC<HintErrorToastProps> = ({ message, onClose }) => (
    <Snackbar
        open={message !== null}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={(_, reason) => {
            if (reason !== "clickaway") {
                onClose();
            }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{ content: { role: "alert", sx: { backgroundColor: "grey.900", color: "common.white" } } }}
        message={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <ErrorOutlineIcon fontSize="small" sx={{ color: "error.light" }} />
                <span>{message}</span>
            </Stack>
        }
        action={
            <IconButton size="small" aria-label="Close" color="inherit" onClick={onClose}>
                <CloseIcon fontSize="small" />
            </IconButton>
        }
    />
);
