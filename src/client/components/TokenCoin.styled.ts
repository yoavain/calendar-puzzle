import { styled } from "@mui/material/styles";

// Highlight and rim shades around theme.game.colors.medal.gold. The coin reads
// the same in both themes, like the medals.
const COIN_HIGHLIGHT = "#fff3a0";
const COIN_EDGE = "#c9a100";
const COIN_RIM = "#b08d00";
const COIN_GLYPH = "#6b5300";

export const CoinRoot = styled("span", {
    shouldForwardProp: (prop) => prop !== "size"
})<{ size: number }>(({ theme, size }) => ({
    width: size,
    height: size,
    flex: "none",
    display: "inline-grid",
    placeItems: "center",
    borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, ${COIN_HIGHLIGHT}, ${theme.game.colors.medal.gold} 45%, ${COIN_EDGE} 100%)`,
    boxShadow: `inset 0 0 0 1.5px ${COIN_RIM}`,
    "& svg": {
        width: "62%",
        height: "62%",
        color: COIN_GLYPH
    }
}));
