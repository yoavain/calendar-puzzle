import { keyframes } from "@emotion/react";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";

// Dark glyph color on the gold badge, readable in both themes.
const GOLD_INK = "#3b2f00";

// Plays when a token lands: the balance grows and settles back.
export const tokenPulse = keyframes`
    45% {
        transform: scale(1.4);
    }
`;

export const BalanceDivider = styled("span")(({ theme }) => ({
    alignSelf: "stretch",
    width: 1,
    margin: theme.spacing(0.25, 1),
    backgroundColor: "currentColor",
    opacity: 0.35
}));

export const TokenBalance = styled("span")(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    "&.pulse": {
        animation: `${tokenPulse} 320ms ease-out`
    }
}));

// Mobile: the balance on the menu button, since the Hint button sits in the drawer.
export const TokenMenuBadgeRoot = styled(Badge)(({ theme }) => ({
    "& .MuiBadge-badge": {
        backgroundColor: theme.game.colors.medal.gold,
        color: GOLD_INK,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
    },
    "& .MuiBadge-badge.pulse": {
        animation: `${tokenPulse} 320ms ease-out`
    }
}));
