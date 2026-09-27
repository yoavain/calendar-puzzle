import { styled } from "@mui/material/styles";
import { CoinRoot } from "./TokenCoin.styled";

// docs/plan/2026-09-27-hint-tokens-ui-decisions.md, item 5
export const TOKEN_FLIGHT_MS = 850;
export const TOKEN_FLIGHT_EASING = "ease-in-out";
export const TOKEN_FLIGHT_SIZE = 26;

// Sits above dialogs (MUI modal z-index 1300); invisible except while animating.
export const FlyingToken = styled(CoinRoot)({
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1400,
    opacity: 0,
    pointerEvents: "none"
});
