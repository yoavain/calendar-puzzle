import { styled } from "@mui/material/styles";
import { keyframes } from "@emotion/react";

export const pulseRingAnim = keyframes`
    0%   { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
    15%  { opacity: 0.85; }
    60%  { transform: translate(-50%, -50%) scale(1.2); opacity: 0.4; }
    100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
`;

export const shimmerAnim = keyframes`
    0%   { opacity: 0; }
    20%  { opacity: 0.6; }
    100% { opacity: 0; }
`;

export const Overlay = styled("div")({
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 10
});

export const PulseRing = styled("div")(({ theme }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "100%",
    height: "100%",
    transform: "translate(-50%, -50%) scale(0.1)",
    background: `radial-gradient(ellipse at center, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main}88 35%, transparent 70%)`,
    animation: `${pulseRingAnim} 700ms ease-out forwards`
}));

export const Shimmer = styled("div")({
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, transparent 65%)",
    animation: `${shimmerAnim} 500ms ease-out forwards`,
    opacity: 0
});
