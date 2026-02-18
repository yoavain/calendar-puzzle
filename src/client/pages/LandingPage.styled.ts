import { styled } from "@mui/material/styles";

export const LandingContainer = styled("div")({
    minHeight: "100vh",
    background: "linear-gradient(180deg, #222 0%, #111 40%, #0a0a0a 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden"
});

export const TitleSection = styled("div")({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    marginBottom: 24,
    zIndex: 10,
    "& img": {
        height: 128,
        width: "auto",
        filter: "drop-shadow(0 4px 16px rgba(255, 255, 255, 0.12))"
    }
});

export const SceneContainer = styled("div")({
    position: "relative",
    width: 700,
    height: 560,
    perspective: 1200,
    perspectiveOrigin: "50% 40%"
});

export const TiltedScene = styled("div")({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transform: "rotateX(24deg) rotateY(-3deg)",
    transformStyle: "preserve-3d"
});

export const BoardCenter = styled("div")({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -55%)",
    transformStyle: "preserve-3d"
});

// Generate box-shadow extrusion layers for the board slab
const BOARD_DEPTH = 16;
const boardExtrusion = Array.from({ length: BOARD_DEPTH }, (_, i) => {
    const n = i + 1;
    // Darken gradually from #2a2a2a toward #111
    const shade = Math.max(0x11, 0x2a - Math.round((n / BOARD_DEPTH) * 0x19));
    const hex = shade.toString(16).padStart(2, "0");
    return `${n}px ${n}px 0 #${hex}${hex}${hex}`;
}).join(", ");

export const BoardDepth = styled("div")({
    position: "relative",
    borderRadius: 22,
    boxShadow: `${boardExtrusion}, 0 30px 60px rgba(0,0,0,0.7), 0 60px 100px rgba(0,0,0,0.5)`
});
