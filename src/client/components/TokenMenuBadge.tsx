import React, { useState } from "react";
import { TokenMenuBadgeRoot } from "./HintButton.styled";

interface TokenMenuBadgeProps {
    tokenBalance: number;
    invisible: boolean;
    children: React.ReactElement;
}

/**
 * Gold balance badge for the mobile menu button. It is the mobile landing
 * target of the token flight (data-token-target) and pulses when the balance grows.
 */
export const TokenMenuBadge: React.FC<TokenMenuBadgeProps> = ({ tokenBalance, invisible, children }) => {
    const [prevBalance, setPrevBalance] = useState(tokenBalance);
    const [pulseKey, setPulseKey] = useState(0);
    if (tokenBalance !== prevBalance) {
        setPrevBalance(tokenBalance);
        if (tokenBalance > prevBalance) {
            setPulseKey(key => key + 1);
        }
    }

    return (
        <TokenMenuBadgeRoot
            badgeContent={tokenBalance}
            showZero
            invisible={invisible}
            overlap="circular"
            slotProps={{
                badge: {
                    // A new key restarts the pulse animation
                    key: pulseKey,
                    className: pulseKey > 0 ? "pulse" : undefined,
                    ...{ "data-token-target": "true" }
                }
            }}
        >
            {children}
        </TokenMenuBadgeRoot>
    );
};
