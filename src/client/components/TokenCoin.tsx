import React from "react";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { CoinRoot } from "./TokenCoin.styled";

interface TokenCoinProps {
    size?: number;
}

/** The hint token: a gold coin with a lightbulb. Decorative; callers carry the text. */
export const TokenCoin: React.FC<TokenCoinProps> = ({ size = 16 }) => (
    <CoinRoot size={size} aria-hidden="true">
        <LightbulbIcon />
    </CoinRoot>
);
