import type { LayoutType } from "../layouts/types";

/**
 * Hook that returns the current layout type.
 * 
 * For now, this always returns "desktop" as the mobile layouts
 * are not yet implemented. In the future, this will detect the
 * device/viewport and return the appropriate layout.
 * 
 * The actual layout selection logic will be implemented when
 * mobile layouts are added.
 */
export function useLayout(): LayoutType {
    // TODO: Implement actual layout detection based on:
    // - Screen width/height
    // - Device orientation
    // - User preference (if any)
    
    return "desktop";
}
