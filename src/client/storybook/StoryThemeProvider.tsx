import React from "react";
import type { ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ColorModeContext } from "../theme/ColorModeContext";
import { darkTheme, lightTheme } from "../theme/theme";

export const StoryThemeProvider = ({ children, mode }: { children: ReactNode; mode: "light" | "dark" }) => (
    <ColorModeContext.Provider value={{ mode, effectiveMode: mode, toggleColorMode: () => {}, setMode: () => {} }}>
        <MuiThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
            <CssBaseline />
            {children}
        </MuiThemeProvider>
    </ColorModeContext.Provider>
);
