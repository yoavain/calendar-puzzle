import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import type { ThemeMode } from "./theme";
import { darkTheme, lightTheme } from "./theme";

// Smooth theme cross-fade — scoped to surfaces whose colors change on theme swap.
// Descendant text/border/fill cascade via inheritance, so a wider `*` rule isn't
// needed and would add unwanted fades on hover transitions.
const themeTransitionStyles = {
    "body, .MuiPaper-root, [data-theme-transition]": {
        transition: "background-color 0.3s ease, color 0.25s ease, border-color 0.25s ease, fill 0.25s ease, stroke 0.25s ease"
    }
};

interface ColorModeContextType {
    mode: ThemeMode;
    effectiveMode: "light" | "dark";
    toggleColorMode: () => void;
    setMode: (mode: ThemeMode) => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
    mode: "system",
    effectiveMode: "dark",
    toggleColorMode: () => {},
    setMode: () => {}
});

export const useColorMode = () => useContext(ColorModeContext);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Initialize from localStorage or default to system
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
            return savedTheme as ThemeMode;
        }
        return "system";
    });

    const [systemMode, setSystemMode] = useState<"light" | "dark">(() => 
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    );

    // Handle system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemMode(e.matches ? "dark" : "light");
        };

        // Use addEventListener if available, fallback to addListener for older browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
        }
        else {
            mediaQuery.addListener(handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handleChange);
            }
            else {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, []);

    const effectiveMode = mode === "system" ? systemMode : mode;

    const colorMode = useMemo<ColorModeContextType>(
        () => ({
            mode,
            effectiveMode,
            toggleColorMode: () => {
                setModeState(() => {
                    const newMode = effectiveMode === "light" ? "dark" : "light";
                    localStorage.setItem("theme", newMode);
                    return newMode;
                });
            },
            setMode: (newMode: ThemeMode) => {
                localStorage.setItem("theme", newMode);
                setModeState(newMode);
            }
        }),
        [mode, effectiveMode, systemMode]
    );

    const theme = effectiveMode === "light" ? lightTheme : darkTheme;

    return (
        <ColorModeContext.Provider value={colorMode}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                <GlobalStyles styles={themeTransitionStyles} />
                {children}
            </MuiThemeProvider>
        </ColorModeContext.Provider>
    );
};
