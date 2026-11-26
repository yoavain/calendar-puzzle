import React, { useState } from "react";
import type { ButtonProps } from "@mui/material/Button";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import type { HintAvailability } from "../../common/hintTokens";
import { HINT_TOKEN_COPY } from "../copy/hintTokenCopy";
import { TooltipDisabledWrapper } from "./TooltipDisabledWrapper";
import { TokenCoin } from "./TokenCoin";
import { useIsEmbedded } from "../context/EmbeddedContext";
import { EMBED_COPY } from "../copy/embedCopy";
import { BalanceDivider, TokenBalance } from "./HintButton.styled";

interface HintButtonProps {
    onHint: () => void;
    /** Takes a signed-out player's click. Without it, the button is disabled for them. */
    onSignInRequired?: () => void;
    availability: HintAvailability;
    tokenBalance: number;
    fullWidth?: boolean;
    color?: ButtonProps["color"];
    sx?: SxProps<Theme>;
}

export const HintButton: React.FC<HintButtonProps> = ({ onHint, onSignInRequired, availability, tokenBalance, fullWidth, color = "secondary", sx }) => {
    const copy = HINT_TOKEN_COPY.hintButton[availability];
    const isEmbedded = useIsEmbedded();
    const tooltip = isEmbedded && availability === "login-required" ? EMBED_COPY.signInTooltip : copy.tooltip(tokenBalance);
    const signInAction = availability === "login-required" ? onSignInRequired : undefined;
    const isEnabled = availability === "free" || availability === "token" || !!signInAction;
    const isLoading = availability === "loading";
    const showBalance = availability !== "login-required" && availability !== "paused" && !isLoading;

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
            color={color}
            onClick={signInAction ?? onHint}
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
        <Tooltip title={tooltip} arrow>
            <TooltipDisabledWrapper disabled={!isEnabled}>{button}</TooltipDisabledWrapper>
        </Tooltip>
    );
};
