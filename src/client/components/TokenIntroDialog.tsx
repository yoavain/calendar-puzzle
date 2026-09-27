import React from "react";
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
    onClose: () => void;
}

const copy = HINT_TOKEN_COPY.intro;

/**
 * Which balance line to show. On the first view the balance equals the solved
 * count (no extra hints were possible before tokens existed); once tokens were
 * spent, the dialog was reopened from the menu and shows the plain balance.
 */
const balanceLine = (tokenBalance: number, solvedCount: number): string => {
    if (solvedCount === 0) {
        return copy.newUser;
    }
    return tokenBalance === solvedCount ? copy.startingBalance(tokenBalance) : copy.balance(tokenBalance);
};

/** Explains hint tokens. Opens once per user, and again from the user menu. */
export const TokenIntroDialog: React.FC<TokenIntroDialogProps> = ({ open, tokenBalance, solvedCount, onClose }) => {
    const [solveStep, earnStep, spendStep] = copy.steps;

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
                        <span>{balanceLine(tokenBalance, solvedCount)}</span>
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
