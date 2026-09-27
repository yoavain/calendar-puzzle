import React, { useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BaseDialog } from "./BaseDialog";
import { TokenCoin } from "./TokenCoin";
import { HINT_TOKEN_COPY } from "../copy/hintTokenCopy";

interface TokenConfirmDialogProps {
    open: boolean;
    tokenBalance: number;
    onConfirm: (dontAskAgain: boolean) => void;
    onCancel: () => void;
}

const copy = HINT_TOKEN_COPY.confirm;

/** Asks before hint #2 and later spend a token. */
export const TokenConfirmDialog: React.FC<TokenConfirmDialogProps> = ({ open, tokenBalance, onConfirm, onCancel }) => {
    const [dontAskAgain, setDontAskAgain] = useState(false);

    // Start every opening unticked
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setDontAskAgain(false);
        }
    }

    return (
        <BaseDialog open={open} onClose={onCancel}>
            <DialogTitle sx={{ fontWeight: "bold" }}>{copy.title}</DialogTitle>
            <DialogContent>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <TokenCoin size={44} />
                    <div>
                        <Typography variant="body1">{copy.body(tokenBalance)}</Typography>
                        <Typography variant="body2" color="text.secondary">{copy.earnMore}</Typography>
                    </div>
                </Stack>
                <FormControlLabel
                    sx={{ mt: 1 }}
                    control={<Checkbox checked={dontAskAgain} onChange={(_, checked) => setDontAskAgain(checked)} />}
                    label={copy.dontAskAgain}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">
                    {copy.cancel}
                </Button>
                <Button onClick={() => onConfirm(dontAskAgain)} color="primary" variant="contained" autoFocus>
                    {copy.confirm}
                </Button>
            </DialogActions>
        </BaseDialog>
    );
};
