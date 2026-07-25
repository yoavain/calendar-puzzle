/**
 * Reduced-motion detection.
 *
 * Callers should skip to the final visual state rather than dropping the
 * feedback entirely — a player who prefers reduced motion still gets the
 * reward, just without the animation.
 */
export const prefersReducedMotion = (): boolean =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
