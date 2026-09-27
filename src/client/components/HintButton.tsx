import React, { useState } from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import type { HintAvailability } from "../../common/hintTokens";
import { HINT_TOKEN_COPY } from "../copy/hintTokenCopy";
import { TooltipDisabledWrapper } from "./TooltipDisabledWrapper";
import { TokenCoin } from "./TokenCoin";
import { BalanceDivider, TokenBalance } from "./HintButton.styled";

interface HintButtonProps {
    onHint: () => void;
    availability: HintAvailability;
    tokenBalance: number;
    fullWidth?: boolean;
    sx?: SxProps<Theme>;
}

export const HintButton: React.FC<HintButtonProps> = ({ onHint, availability, tokenBalance, fullWidth, sx }) => {
    const copy = HINT_TOKEN_COPY.hintButton[availability];
    const isEnabled = availability === "free" || availability === "token";
    const isLoading = availability === "loading";
    const showBalance = availability !== "login-required" && !isLoading;

    // Pulse the balance when it grows (a token landed). A new key remounts the
    // span, which restarts its animation.
    const [prevBalance, setPrevBalance] = useState(tokenBalance);
    const [pulseKey, setPulseKey] = useState(0);
    if (tokenBalance !== prevBalance) {
        setPrevBalance(tokenBalance);
        if (tokenBalance > prevBalance) {
            setPulseKey(key => key + 1);
        }
    }

    const button = (
        <Button
            variant="contained"
            color="secondary"
            onClick={onHint}
            disabled={!isEnabled}
            loading={isLoading}
            loadingPosition="start"
            startIcon={<LightbulbIcon />}
            size="small"
            fullWidth={fullWidth}
            sx={sx}
        >
            {copy.label}
            {showBalance && (
                <>
                    <BalanceDivider aria-hidden="true" />
                    <TokenBalance key={pulseKey} className={pulseKey > 0 ? "pulse" : undefined} data-token-target="true">
                        <TokenCoin />
                        <span>{tokenBalance}</span>
                    </TokenBalance>
                </>
            )}
        </Button>
    );

    return (
        <Tooltip title={copy.tooltip(tokenBalance)} arrow>
            <TooltipDisabledWrapper disabled={!isEnabled}>{button}</TooltipDisabledWrapper>
        </Tooltip>
    );
};
