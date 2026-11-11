import { styled, alpha } from "@mui/material/styles";
import { PIECE_TRANSFORM_TRANSITION } from "../utils/pieceTransform";

/** Preferred side of a thumbnail tile, in px. Above the 24px WCAG 2.2 target minimum. */
export const THUMBNAIL_SIZE = 40;

/** Smallest side a tile shrinks to when the strip is short of room, in px. */
export const THUMBNAIL_MIN_SIZE = 24;

/**
 * Group that holds the cells of a thumbnail. It rotates and flips with the same transition as the
 * piece in the carousel, around the centre of the 4 x 4 grid (2, 2). The transform itself is dynamic,
 * so the component sets it through `style`.
 */
export const ThumbnailShape = styled("g")({
    transformOrigin: "2px 2px",
    transition: PIECE_TRANSFORM_TRANSITION
});

/**
 * One tile of the carousel strip: a button that draws a piece's shape.
 *
 * `flex: 0 1 40px` sets the size along the strip, and `aspect-ratio` sets the other
 * side, so the same tile works in a row (portrait) and in a column (landscape).
 * The ring is an inset shadow, so an active tile does not change the layout.
 */
export const ThumbnailButton = styled("button", {
    shouldForwardProp: (prop) => prop !== "isActive" && prop !== "isPlaced"
})<{ isActive: boolean; isPlaced: boolean }>(({ theme, isActive, isPlaced }) => ({
    flex: `0 1 ${THUMBNAIL_SIZE}px`,
    aspectRatio: "1 / 1",
    minWidth: THUMBNAIL_MIN_SIZE,
    minHeight: THUMBNAIL_MIN_SIZE,
    padding: 0,
    border: 0,
    borderRadius: theme.shape.borderRadius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.14) : "transparent",
    boxShadow: isActive ? `inset 0 0 0 2px ${theme.palette.primary.main}` : "none",
    opacity: isPlaced ? 0.28 : 1,
    filter: isPlaced ? "grayscale(1)" : "none",
    cursor: isPlaced ? "default" : "pointer",
    transition: "background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
    WebkitTapHighlightColor: "transparent",
    "&:hover": isPlaced || isActive
        ? undefined
        : { backgroundColor: theme.palette.action.hover },
    "&:focus-visible": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 1
    }
}));
