import React, { useEffect, useRef, useState } from "react";
import { Overlay, PulseRing, Shimmer } from "./WinCelebration.styled";

interface WinCelebrationProps {
    active: boolean;
}

export function WinCelebration({ active }: WinCelebrationProps) {
    const [animKey, setAnimKey] = useState(0);
    const prevActiveRef = useRef(false);

    useEffect(() => {
        if (active && !prevActiveRef.current) {
            setAnimKey(k => k + 1);
        }
        prevActiveRef.current = active;
    }, [active]);

    // Don't render on initial mount when already active (e.g. loading a solved session)
    if (animKey === 0) {
        return null;
    }

    return (
        <Overlay>
            <PulseRing key={animKey} />
            <Shimmer key={`shimmer-${animKey}`} />
        </Overlay>
    );
}
