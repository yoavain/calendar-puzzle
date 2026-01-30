import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

/**
 * Height of the carousel container.
 */
export const CAROUSEL_HEIGHT = 260;

/**
 * Container for the carousel.
 * Full width with hidden overflow.
 */
export const CarouselContainer = styled(Box)(({ theme }) => ({
    width: "100%",
    height: CAROUSEL_HEIGHT,
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    position: "relative",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    paddingTop: theme.spacing(1)
}));

/**
 * Embla carousel viewport - clips the overflow.
 * Must NOT have display:flex or alignItems as it breaks embla's layout.
 */
export const CarouselViewport = styled(Box)({
    overflow: "hidden",
    flex: 1
});

/**
 * Embla carousel container - holds all slides.
 */
export const CarouselTrack = styled(Box)({
    display: "flex",
    height: "100%",
    alignItems: "center", // Center slides vertically within track
    touchAction: "pan-y pinch-zoom" // Allow vertical scroll and zoom, restrict horizontal to carousel
});

/**
 * State for carousel slides.
 * - "active": Current centered slide (fully visible)
 * - "adjacent": Immediate neighbor slides (partially visible)
 * - "hidden": All other slides (completely hidden to prevent loop glitch)
 */
export type SlideState = "active" | "adjacent" | "hidden";

/**
 * Individual carousel slide containing a piece and its controls.
 * Uses slideState prop to hide non-adjacent slides during loop transitions.
 */
export const CarouselSlide = styled(Box)<{ slideState: SlideState }>(({ slideState }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start", // Align content to top
    flex: "0 0 70%", // Each slide takes 70% of viewport width
    minWidth: 0,
    height: "100%",
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    // Active slide: fully visible
    // Adjacent slides: dimmed and scaled down
    // Hidden slides: completely invisible (prevents loop animation glitch)
    opacity: slideState === "active" ? 1 : slideState === "adjacent" ? 0.4 : 0,
    transform: slideState === "active" ? "scale(1)" : "scale(0.85)",
    transition: "opacity 0.15s ease, transform 0.15s ease",
    // Prevent hidden slides from being interactable
    pointerEvents: slideState === "hidden" ? "none" : "auto"
}));

/**
 * Wrapper for the piece within the carousel slide.
 */
export const PieceWrapper = styled(Box)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    position: "relative",
    minHeight: 0
});

/**
 * Container for piece controls within the carousel.
 * Added margin-top to separate from piece border.
 */
export const ControlsWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    paddingBottom: theme.spacing(0.5),
    flexShrink: 0
}));

/**
 * Indicator dots showing current position in carousel.
 */
export const IndicatorContainer = styled(Box)({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 8,
    flexShrink: 0
});

/**
 * Individual indicator dot.
 */
export const IndicatorDot = styled(Box)<{ isActive?: boolean }>(({ theme, isActive }) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: isActive 
        ? theme.palette.primary.main 
        : theme.palette.action.disabled,
    transition: "background-color 0.2s ease",
    cursor: "pointer"
}));
