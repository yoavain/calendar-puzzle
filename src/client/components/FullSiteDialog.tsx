import React from "react";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { BaseDialog } from "./BaseDialog";
import { HallOfFamePreview, HintButtonPreview } from "./FullSitePreviews";
import { Body, Intro, paperSx } from "./FullSiteDialog.styled";
import { EMBED_COPY } from "../copy/embedCopy";

interface FullSiteDialogProps {
    open: boolean;
    onClose: () => void;
}

const copy = EMBED_COPY.dialog;

/** Takes the place of sign-in when the game is in a frame. The link opens the game in its own tab. */
export const FullSiteDialog: React.FC<FullSiteDialogProps> = ({ open, onClose }) => (
    <BaseDialog size="compact" open={open} onClose={onClose} aria-describedby="full-site-description" slotProps={{ paper: { sx: paperSx } }}>
        <DialogTitle sx={{ fontWeight: "bold" }}>{copy.title}</DialogTitle>
        <DialogContent>
            <Body>
                <Intro id="full-site-description">
                    <Typography variant="body1">{copy.body}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{copy.boardStays}</Typography>
                </Intro>
                <HallOfFamePreview />
                <HintButtonPreview />
            </Body>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} color="inherit" variant="outlined">
                {copy.stay}
            </Button>
            {/* The frame has the origin of the original site, so Dev links to Dev. `ref` marks the visit in analytics. */}
            <Button
                href={`${window.location.origin}/?ref=embed`}
                target="_blank"
                rel="noopener"
                onClick={onClose}
                color="primary"
                variant="contained"
                endIcon={<OpenInNewIcon />}
                autoFocus
            >
                {copy.open}
            </Button>
        </DialogActions>
    </BaseDialog>
);
