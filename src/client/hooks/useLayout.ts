import { useEffect, useState } from "react";
import type { LayoutType } from "../layouts/types";

/**
 * Breakpoints for layout detection.
 * - MOBILE_MAX_WIDTH: Maximum width to consider as mobile portrait
 * - TABLET_MAX_WIDTH: Maximum width to consider as mobile landscape (touch device)
 */
const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

/**
 * Check if the device supports touch input.
 */
function isTouchDevice(): boolean {
    if (typeof window === "undefined") {
        return false;
    }
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Determine the layout type based on viewport dimensions and touch capability.
 */
function detectLayout(width: number, height: number, isTouch: boolean): LayoutType {
    // Portrait: Touch device with narrow width and taller than wide
    if (isTouch && width < MOBILE_MAX_WIDTH && height > width) {
        return "mobile-portrait";
    }
    
    // Landscape: Touch device with moderate width and wider than tall
    if (isTouch && width < TABLET_MAX_WIDTH && width > height) {
        return "mobile-landscape";
    }
    
    // Default to desktop for larger screens or non-touch devices
    return "desktop";
}

/**
 * Hook that returns the current layout type based on:
 * - Touch capability (touch screens get mobile layouts)
 * - Viewport dimensions (width/height determine portrait vs landscape)
 * 
 * The hook listens to resize and orientation change events to update the layout.
 */
export function useLayout(): LayoutType {
    const [layout, setLayout] = useState<LayoutType>(() => {
        if (typeof window === "undefined") {
            return "desktop";
        }
        return detectLayout(window.innerWidth, window.innerHeight, isTouchDevice());
    });

    useEffect(() => {
        const isTouch = isTouchDevice();

        const updateLayout = () => {
            const newLayout = detectLayout(window.innerWidth, window.innerHeight, isTouch);
            setLayout(newLayout);
        };

        // Update on resize
        window.addEventListener("resize", updateLayout);
        
        // Update on orientation change (mobile devices)
        window.addEventListener("orientationchange", updateLayout);

        // Initial check
        updateLayout();

        return () => {
            window.removeEventListener("resize", updateLayout);
            window.removeEventListener("orientationchange", updateLayout);
        };
    }, []);

    return layout;
}
