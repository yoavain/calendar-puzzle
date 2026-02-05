import React from "react";
import type { LayoutType } from "./types";
import { LayoutProvider } from "./LayoutContext";
import { DesktopLayout } from "./desktop/DesktopLayout";
import { PortraitLayout } from "./mobile-portrait/PortraitLayout";
import { LandscapeLayout } from "./mobile-landscape/LandscapeLayout";

interface LayoutRootProps {
    /**
     * Function that returns the current layout type.
     * This allows the selection logic to be injected from outside.
     */
    layoutSelector: () => LayoutType;
}

/**
 * Root component that renders the appropriate layout based on the layoutSelector.
 * 
 * This is the single entry point for all layouts. It:
 * 1. Calls the layoutSelector to determine which layout to render
 * 2. Wraps the layout in a LayoutProvider for context access
 * 3. Renders the appropriate layout component
 */
export const LayoutRoot: React.FC<LayoutRootProps> = ({ layoutSelector }) => {
    const layout = layoutSelector();
    
    return (
        <LayoutProvider layout={layout}>
            {layout === "desktop" && <DesktopLayout />}
            {layout === "mobile-portrait" && <PortraitLayout />}
            {layout === "mobile-landscape" && <LandscapeLayout />}
        </LayoutProvider>
    );
};
