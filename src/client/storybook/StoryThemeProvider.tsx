import React, { useMemo } from "react";
import type { ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ColorModeContext } from "../theme/ColorModeContext";
import { darkTheme, lightTheme } from "../theme/theme";

export const StoryThemeProvider = ({ children, mode }: { children: ReactNode; mode: "light" | "dark" }) => {
    const colorMode = useMemo(
        () => ({ mode, effectiveMode: mode, toggleColorMode: () => {}, setMode: () => {} }),
        [mode]
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            <MuiThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ColorModeContext.Provider>
    );
};
