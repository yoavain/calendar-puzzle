import { styled } from "@mui/material/styles";

export const LandingContainer = styled("div")({
    minHeight: "100vh",
    background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: "40px 16px",
    overflow: "hidden"
});

export const PerspectiveContainer = styled("div")({
    perspective: 1000,
    perspectiveOrigin: "50% 45%"
});

export const TiltedContent = styled("div")({
    transform: "rotateX(35deg)",
    transformStyle: "preserve-3d",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 32
});

export const TitleSection = styled("div")({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    transformStyle: "preserve-3d",
    "& img": {
        height: 128,
        width: "auto",
        filter: "drop-shadow(0 4px 12px rgba(255, 255, 255, 0.15))"
    }
});

export const BoardWrapper = styled("div")({
    position: "relative",
    transformStyle: "preserve-3d",
    // 3D depth extrusion for the board
    "&::before": {
        content: "\"\"",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(180deg, #2a2a2a 0%, #111 100%)",
        borderRadius: 22,
        transform: "translateZ(-20px)",
        boxShadow: "0 40px 80px rgba(0, 0, 0, 0.8)"
    }
});

export const PiecesRow = styled("div")({
    display: "flex",
    justifyContent: "center",
    transformStyle: "preserve-3d"
});
