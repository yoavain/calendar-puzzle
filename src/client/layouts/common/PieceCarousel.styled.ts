import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { THUMBNAIL_SIZE } from "../../components/PieceThumbnail.styled";

/**
 * Space around the thumbnail strip, in px. It equals `theme.spacing(1)` at the default 8px spacing.
 * It is a plain number because `CAROUSEL_HEIGHT` is a number that other code uses in sums.
 */
const THUMBNAIL_STRIP_GUTTER = 8;

/**
 * Size of the thumbnail strip across its axis, in px: one tile plus the gutter on the open side.
 * Horizontal: the strip height. Vertical: the strip width.
 */
const THUMBNAIL_STRIP_SIZE = THUMBNAIL_SIZE + THUMBNAIL_STRIP_GUTTER;

/**
 * Height of the carousel container above the thumbnail strip (horizontal axis), in px.
 * It holds the container padding, the slide, the piece and the controls.
 */
const CAROUSEL_SLIDE_AREA_HEIGHT = 244;

/**
 * Height of the carousel container (horizontal axis): the slide area plus the thumbnail strip.
 * `getAvailableBoardHeight` reads this, so it also sets the board and piece scale.
 * A change to `THUMBNAIL_SIZE` changes this value and shrinks or grows the board.
 */
export const CAROUSEL_HEIGHT = CAROUSEL_SLIDE_AREA_HEIGHT + THUMBNAIL_STRIP_SIZE;

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
 * Only the active slide shows its controls. Hiding them with visibility keeps
 * the slide's layout, removes them from the tab order, and lets a touch on the
 * empty space reach the slide, so a swipe still starts there.
 * Horizontal: one row of four. Vertical: a 2 x 2 grid, because the slide is too
 * narrow for one row of four.
 */
export const ControlsWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isActive" && prop !== "axis"
})<{ isActive: boolean; axis?: CarouselAxis }>(({ theme, isActive, axis }) => ({
    ...(axis === "y"
        ? { display: "grid", gridTemplateColumns: "repeat(2, auto)" }
        : { display: "flex", flexDirection: "row" }),
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    paddingBottom: theme.spacing(0.5),
    flexShrink: 0,
    opacity: isActive ? 1 : 0,
    visibility: isActive ? "visible" : "hidden",
    transition: "opacity 0.15s ease, visibility 0.15s"
}));

/**
 * Strip of piece thumbnails (one per piece).
 * Horizontal: row below the viewport. Vertical: column to the right of the viewport.
 * The tiles shrink to fit, so the strip never scrolls and never clips.
 */
export const IndicatorContainer = styled(Box)<{ axis?: CarouselAxis }>(({ theme, axis }) => ({
    display: "flex",
    flexDirection: axis === "y" ? "column" : "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(0.25),
    flexShrink: 0,
    ...(axis === "y"
        // Fixed width: left gutter + one tile. Without it the flex item grows to its
        // intrinsic width, which is wrong for tiles that size themselves with aspect-ratio.
        ? { boxSizing: "border-box", width: THUMBNAIL_STRIP_SIZE, paddingLeft: THUMBNAIL_STRIP_GUTTER, minHeight: 0 }
        : { padding: `0 ${THUMBNAIL_STRIP_GUTTER}px ${THUMBNAIL_STRIP_GUTTER}px`, minWidth: 0 })
}));
