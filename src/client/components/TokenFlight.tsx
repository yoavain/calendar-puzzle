import React, { useEffect, useEffectEvent, useRef } from "react";
import { createPortal } from "react-dom";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { FlyingToken, TOKEN_FLIGHT_EASING, TOKEN_FLIGHT_MS, TOKEN_FLIGHT_SIZE } from "./TokenFlight.styled";

interface TokenFlightProps {
    /** Tokens earned but not yet landed */
    pending: number;
    /** Epoch ms before which no flight starts (lets the win sweep finish) */
    notBefore: number;
    onLanded: () => void;
}

/** First element matching the selector that has a size and is inside the viewport. */
export const findVisibleElement = (selector: string): HTMLElement | null => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth) {
            return el;
        }
    }
    return null;
};

const prefersReducedMotion = (): boolean => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const centerOf = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const half = TOKEN_FLIGHT_SIZE / 2;
    return { x: r.left + r.width / 2 - half, y: r.top + r.height / 2 - half };
};

/**
 * Flies an earned token from the board ([data-token-source]) to the balance
 * ([data-token-target]), then lands it. Lands at once when motion is reduced,
 * when either end is not on screen, or when the Web Animations API is missing.
 */
export const TokenFlight: React.FC<TokenFlightProps> = ({ pending, notBefore, onLanded }) => {
    const tokenRef = useRef<HTMLSpanElement>(null);
    const land = useEffectEvent(onLanded);

    useEffect(() => {
        if (pending === 0) {
            return;
        }

        let animation: Animation | null = null;
        const fly = () => {
            const source = findVisibleElement("[data-token-source]");
            const target = findVisibleElement("[data-token-target]");
            const token = tokenRef.current;
            if (prefersReducedMotion() || !source || !target || !token || typeof token.animate !== "function") {
                land();
                return;
            }
            const from = centerOf(source);
            const to = centerOf(target);
            animation = token.animate(
                [
                    { transform: `translate(${from.x}px, ${from.y}px) scale(0)`, opacity: 1 },
                    { transform: `translate(${from.x}px, ${from.y}px) scale(1.2)`, opacity: 1, offset: 0.18 },
                    { transform: `translate(${to.x}px, ${to.y}px) scale(0.6)`, opacity: 1 }
                ],
                { duration: TOKEN_FLIGHT_MS, easing: TOKEN_FLIGHT_EASING }
            );
            animation.onfinish = () => land();
        };

        const wait = notBefore - Date.now();
        if (wait <= 0) {
            fly();
            return () => animation?.cancel();
        }
        const timer = window.setTimeout(fly, wait);
        return () => {
            window.clearTimeout(timer);
            animation?.cancel();
        };
    }, [pending, notBefore]);

    return createPortal(
        <FlyingToken ref={tokenRef} size={TOKEN_FLIGHT_SIZE} aria-hidden="true">
            <LightbulbIcon />
        </FlyingToken>,
        document.body
    );
};
