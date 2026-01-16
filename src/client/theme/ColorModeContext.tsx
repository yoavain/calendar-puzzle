import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme, ThemeMode } from './theme';

interface ColorModeContextType {
    mode: ThemeMode;
    toggleColorMode: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
    mode: 'dark',
    toggleColorMode: () => {},
    setMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Initialize from localStorage or default to dark
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    });

    // Persist theme preference to localStorage
    useEffect(() => {
        localStorage.setItem('theme', mode);
    }, [mode]);

    const colorMode = useMemo<ColorModeContextType>(
        () => ({
            mode,
            toggleColorMode: () => {
                setModeState((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
            setMode: (newMode: ThemeMode) => {
                setModeState(newMode);
            },
        }),
        [mode]
    );

    const theme = mode === 'light' ? lightTheme : darkTheme;

    return (
        <ColorModeContext.Provider value={colorMode}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ColorModeContext.Provider>
    );
};
