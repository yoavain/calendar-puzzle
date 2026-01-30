import React from "react";
import type { LayoutType } from "./types";
import { LayoutProvider } from "./LayoutContext";
import { DesktopLayout } from "./desktop/DesktopLayout";

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
 * 
 * Currently only desktop layout is implemented. Mobile layouts will be added
 * in the future, at which point this component will render them conditionally.
 */
export const LayoutRoot: React.FC<LayoutRootProps> = ({ layoutSelector }) => {
    const layout = layoutSelector();
    
    return (
        <LayoutProvider layout={layout}>
            {layout === "desktop" && <DesktopLayout />}
            {/* Mobile layouts will be added here:
            {layout === "mobile-landscape" && <LandscapeLayout />}
            {layout === "mobile-portrait" && <PortraitLayout />}
            */}
        </LayoutProvider>
    );
};
