import type { ReactNode } from "react";
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import type { ThemeMode } from "./theme";
import { lightTheme, darkTheme } from "./theme";

// Global styles for smooth theme transitions
const themeTransitionStyles = {
    "*, *::before, *::after": {
        transition: "background-color 0.3s ease, color 0.25s ease, border-color 0.25s ease, fill 0.25s ease, stroke 0.25s ease"
    }
};

interface ColorModeContextType {
    mode: ThemeMode;
    toggleColorMode: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
    mode: "dark",
    toggleColorMode: () => {},
    setMode: () => {}
});

export const useColorMode = () => useContext(ColorModeContext);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Initialize from localStorage or default to dark
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const savedTheme = localStorage.getItem("theme");
        return (savedTheme === "light" || savedTheme === "dark") ? savedTheme : "dark";
    });

    // Persist theme preference to localStorage
    useEffect(() => {
        localStorage.setItem("theme", mode);
    }, [mode]);

    const colorMode = useMemo<ColorModeContextType>(
        () => ({
            mode,
            toggleColorMode: () => {
                setModeState((prevMode) => (prevMode === "light" ? "dark" : "light"));
            },
            setMode: (newMode: ThemeMode) => {
                setModeState(newMode);
            }
        }),
        [mode]
    );

    const theme = mode === "light" ? lightTheme : darkTheme;

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
