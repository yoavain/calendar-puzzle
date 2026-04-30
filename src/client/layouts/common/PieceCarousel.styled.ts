import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

/**
 * Height of the carousel container (horizontal axis).
 */
export const CAROUSEL_HEIGHT = 260;

/**
 * Width of the carousel container (vertical axis).
 */
export const CAROUSEL_WIDTH = 220;

export type CarouselAxis = "x" | "y";

/**
 * Container for the carousel.
 * Horizontal: full width, fixed height, border top.
 * Vertical: fixed width, full height, border left.
 */
export const CarouselContainer = styled(Box)<{ axis?: CarouselAxis }>(({ theme, axis }) => ({
    ...(axis === "y"
        ? {
            width: CAROUSEL_WIDTH,
            height: "100%",
            borderLeft: `1px solid ${theme.palette.divider}`,
            paddingLeft: theme.spacing(1),
            flexDirection: "row"
        }
        : {
            width: "100%",
            height: CAROUSEL_HEIGHT,
            borderTop: `1px solid ${theme.palette.divider}`,
            paddingTop: theme.spacing(1),
            flexDirection: "column"
        }),
    backgroundColor: theme.palette.background.paper,
    position: "relative",
    flexShrink: 0,
    display: "flex",
    overflow: "hidden"
}));

/**
 * Embla carousel viewport - clips the overflow.
 * Must NOT have display:flex or alignItems as it breaks embla's layout.
 */
export const CarouselViewport = styled(Box)<{ axis?: CarouselAxis }>(({ axis }) => ({
    overflow: "hidden",
    flex: 1,
    ...(axis === "y" ? { minWidth: 0 } : { minHeight: 0 })
}));

/**
 * Embla carousel container - holds all slides.
 * Horizontal: row, pan-y. Vertical: column, pan-x.
 */
export const CarouselTrack = styled(Box)<{ axis?: CarouselAxis }>(({ axis }) => ({
    display: "flex",
    height: "100%",
    ...(axis === "y"
        ? {
            flexDirection: "column",
            alignItems: "center",
            touchAction: "pan-x pinch-zoom"
        }
        : {
            flexDirection: "row",
            alignItems: "center",
            touchAction: "pan-y pinch-zoom"
        })
}));

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
 * Horizontal: 70% viewport width. Vertical: 70% viewport height.
 */
export const CarouselSlide = styled(Box)<{ slideState: SlideState; axis?: CarouselAxis }>(
    ({ theme, slideState, axis }) => ({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        ...(axis === "y"
            ? {
                flex: "0 0 70%",
                minHeight: 0,
                width: "100%",
                padding: theme.spacing(1)
            }
            : {
                flex: "0 0 70%",
                minWidth: 0,
                height: "100%",
                padding: theme.spacing(1, 1, 0)
            }),
        opacity: slideState === "active" ? 1 : slideState === "adjacent" ? 0.4 : 0,
        transform: slideState === "active" ? "scale(1)" : "scale(0.85)",
        // Hidden slides must disappear instantly to prevent the "fly across" glitch
        // during embla's loop repositioning. Only animate between active/adjacent.
        transition: slideState === "hidden"
            ? "none"
            : "opacity 0.15s ease, transform 0.15s ease",
        pointerEvents: slideState === "hidden" ? "none" : "auto"
    })
);

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
 * Horizontal: row below viewport. Vertical: column to the right of viewport.
 */
export const IndicatorContainer = styled(Box)<{ axis?: CarouselAxis }>(({ theme, axis }) => ({
    display: "flex",
    flexDirection: axis === "y" ? "column" : "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(0.75),
    flexShrink: 0,
    ...(axis === "y" ? { paddingLeft: theme.spacing(1) } : { paddingBottom: theme.spacing(1) })
}));

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
    transition: "background-color 0.2s ease, transform 0.15s ease",
    cursor: "pointer",
    "&:hover": {
        transform: "scale(1.2)"
    },
    "&:focus-visible": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2
    }
}));
