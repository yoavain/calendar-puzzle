import { useEffect, useRef, useState } from "react";
import type { Piece } from "../../common/types";

/**
 * Rotation angle in degrees that keeps growing or shrinking, instead of wrapping at 360.
 *
 * A piece's `rotation` is 0, 90, 180 or 270. If a CSS transition ran from 270 to 0, the piece
 * would spin 270 degrees back the other way. This hook adds the shortest turn (clockwise or
 * counter-clockwise) to a running total, so the transition always turns the short way.
 *
 * Every view of a piece (the piece itself, its carousel thumbnail) uses this hook with the
 * same transition, so they turn together.
 */
export const useCumulativeRotation = (rotation: Piece["rotation"]): number => {
    const prevRotation = useRef<number>(rotation);
    const [cumulativeRotation, setCumulativeRotation] = useState<number>(rotation);

    useEffect(() => {
        const prev = prevRotation.current;
        if (prev === rotation) {
            return;
        }
        const cwDelta = (rotation - prev + 360) % 360; // Clockwise distance
        const ccwDelta = (prev - rotation + 360) % 360; // Counter-clockwise distance
        // Take the shorter path. A tie goes clockwise.
        const delta = cwDelta <= ccwDelta ? cwDelta : -ccwDelta;

        // When exactly one flip is active, the CSS scale reverses the visual direction.
        // The Game state handlers invert the logical rotation for that case, so the visual
        // rotation always follows the logical rotation here.
        setCumulativeRotation(r => r + delta);
        prevRotation.current = rotation;
    }, [rotation]);

    return cumulativeRotation;
};
