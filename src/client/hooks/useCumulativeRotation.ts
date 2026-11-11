import { useState } from "react";
import type { Piece } from "../../common/types";

/**
 * Rotation angle in degrees that keeps growing or shrinking, instead of wrapping at 360.
 *
 * A piece's `rotation` is 0, 90, 180 or 270. If a CSS transition ran from 270 to 0, the piece
 * would spin 270 degrees back the other way. This hook adds the shortest turn (clockwise or
 * counter-clockwise) to a running total, so the transition always turns the short way.
 *
 * Every view of a piece (the piece itself, its carousel thumbnail) uses this hook with the
 * same transition, so they turn together. Each view keeps its own total. The totals can differ
 * by a multiple of 360 (a view that mounts late starts at `rotation`), which looks the same,
 * because every view adds the same turn.
 *
 * The total updates during render, not in an effect. A rotation change then never commits
 * a frame with the new rotation and the old total.
 */
export const useCumulativeRotation = (rotation: Piece["rotation"]): number => {
    const [state, setState] = useState({ prevRotation: rotation as number, total: rotation as number });

    if (state.prevRotation === rotation) {
        return state.total;
    }

    const cwDelta = (rotation - state.prevRotation + 360) % 360; // Clockwise distance
    const ccwDelta = (state.prevRotation - rotation + 360) % 360; // Counter-clockwise distance
    // Take the shorter path. A tie goes clockwise.
    const delta = cwDelta <= ccwDelta ? cwDelta : -ccwDelta;

    // When exactly one flip is active, the CSS scale reverses the visual direction.
    // The Game state handlers invert the logical rotation for that case, so the visual
    // rotation always follows the logical rotation here.
    const next = { prevRotation: rotation as number, total: state.total + delta };
    setState(next);
    return next.total;
};
