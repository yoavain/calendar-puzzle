import React, { useState } from "react";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { BaseDialog } from "./BaseDialog";
import { TokenCoin } from "./TokenCoin";
import { HINT_TOKEN_COPY } from "../copy/hintTokenCopy";
import { BalanceCallout, Step, StepArrow, StepIcon, Steps } from "./TokenIntroDialog.styled";

interface TokenIntroDialogProps {
    open: boolean;
    tokenBalance: number;
    solvedCount: number;
    /** True until the user has closed the intro once */
    isFirstView: boolean;
    onClose: () => void;
}

const copy = HINT_TOKEN_COPY.intro;

/**
 * Which balance line to show. The first view explains the starting balance (one
 * token per solved date); a view reopened from the menu shows the plain balance.
 */
const balanceLine = (tokenBalance: number, solvedCount: number, isFirstView: boolean): string => {
    if (!isFirstView) {
        return copy.balance(tokenBalance);
    }
    return solvedCount === 0 ? copy.newUser : copy.startingBalance(tokenBalance);
};

/** Explains hint tokens. Opens once per user, and again from the user menu. */
export const TokenIntroDialog: React.FC<TokenIntroDialogProps> = ({ open, tokenBalance, solvedCount, isFirstView, onClose }) => {
    const [solveStep, earnStep, spendStep] = copy.steps;

    // Latch isFirstView when the dialog opens: closing marks the intro seen, and
    // the text must not change while the dialog fades out
    const [wasOpen, setWasOpen] = useState(open);
    const [firstView, setFirstView] = useState(isFirstView);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setFirstView(isFirstView);
        }
    }

    return (
        <BaseDialog open={open} onClose={onClose}>
            <DialogTitle sx={{ fontWeight: "bold" }}>{copy.title}</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Steps>
                        <Step>
                            <StepIcon><CheckCircleIcon /></StepIcon>
                            <span>{solveStep}</span>
                        </Step>
                        <StepArrow aria-hidden="true">{"→"}</StepArrow>
                        <Step>
                            <StepIcon><TokenCoin size={22} /></StepIcon>
                            <span>{earnStep}</span>
                        </Step>
                        <StepArrow aria-hidden="true">{"→"}</StepArrow>
                        <Step>
                            <StepIcon><LightbulbIcon /></StepIcon>
                            <span>{spendStep}</span>
                        </Step>
                    </Steps>
                    <Typography variant="body2" color="text.secondary">{copy.firstHintFree}</Typography>
                    <BalanceCallout>
                        <TokenCoin />
                        <span>{balanceLine(tokenBalance, solvedCount, firstView)}</span>
                    </BalanceCallout>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained" autoFocus>
                    {copy.close}
                </Button>
            </DialogActions>
        </BaseDialog>
    );
};
