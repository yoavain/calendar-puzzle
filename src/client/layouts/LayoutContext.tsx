import React, { createContext, useContext, useMemo } from "react";
import type { LayoutConfig, LayoutContextValue, LayoutType } from "./types";
import { DEFAULT_LAYOUT_CONFIGS } from "./types";

const LayoutContext = createContext<LayoutContextValue | null>(null);

interface LayoutProviderProps {
    layout: LayoutType;
    config?: Partial<LayoutConfig>;
    children: React.ReactNode;
}

/**
 * Provides layout configuration to all child components.
 * Allows layouts to access current layout type and configuration.
 */
export const LayoutProvider: React.FC<LayoutProviderProps> = ({ 
    layout, 
    config: configOverrides,
    children 
}) => {
    const value = useMemo<LayoutContextValue>(() => {
        const defaultConfig = DEFAULT_LAYOUT_CONFIGS[layout];
        return {
            layout,
            config: {
                ...defaultConfig,
                ...configOverrides
            }
        };
    }, [layout, configOverrides]);

    return (
        <LayoutContext.Provider value={value}>
            {children}
        </LayoutContext.Provider>
    );
};

/**
 * Hook to access the current layout context.
 * Must be used within a LayoutProvider.
 */
export const useLayoutContext = (): LayoutContextValue => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error("useLayoutContext must be used within a LayoutProvider");
    }
    return context;
};
