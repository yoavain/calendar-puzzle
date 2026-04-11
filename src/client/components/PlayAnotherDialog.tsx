import React from "react";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Zoom from "@mui/material/Zoom";
import { BaseDialog } from "./BaseDialog";

interface PlayAnotherDialogProps {
    isOpen: boolean;
    mode: "just-solved" | "already-solved";
    onAccept: () => void;
    onDecline: () => void;
}

export const PlayAnotherDialog: React.FC<PlayAnotherDialogProps> = ({
    isOpen,
    mode,
    onAccept,
    onDecline
}) => {
    return (
        <BaseDialog
            open={isOpen}
            onClose={onDecline}
            slots={{ transition: Zoom }}
            transitionDuration={300}
        >
            <DialogTitle sx={{ fontWeight: "bold" }}>Great work! 🎉</DialogTitle>
            <DialogContent>
                <Typography variant="body1">
                    {mode === "already-solved"
                        ? "You've already solved today's puzzle. Want to try another?"
                        : "Want to play another puzzle?"}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onDecline} color="inherit">
                    Not now
                </Button>
                <Button onClick={onAccept} color="primary" variant="contained" autoFocus>
                    Let's go!
                </Button>
            </DialogActions>
        </BaseDialog>
    );
};
