import { createTheme, ThemeOptions } from '@mui/material/styles';

// Extend MUI theme interface with custom game tokens
declare module '@mui/material/styles' {
    interface Theme {
        game: {
            cellSize: number;
            cellGap: number;
            pieceColor: string;
            pieceBorderColor: string;
            pieceBorderWidth: number;
            lockedPieceColor: string;
            lockedPieceBorderColor: string;
            boardBorderColor: string;
            boardBorderLightColor: string;
            hoverColor: string;
            activeColor: string;
            disabledColor: string;
            highlightColor: string;
            invalidDropColor: string;
            invalidDropBorderColor: string;
            backgroundTertiary: string;
        };
    }
    interface ThemeOptions {
        game?: {
            cellSize?: number;
            cellGap?: number;
            pieceColor?: string;
            pieceBorderColor?: string;
            pieceBorderWidth?: number;
            lockedPieceColor?: string;
            lockedPieceBorderColor?: string;
            boardBorderColor?: string;
            boardBorderLightColor?: string;
            hoverColor?: string;
            activeColor?: string;
            disabledColor?: string;
            highlightColor?: string;
            invalidDropColor?: string;
            invalidDropBorderColor?: string;
            backgroundTertiary?: string;
        };
    }
}

// Light theme game tokens
const lightGameTokens = {
    cellSize: 50,
    cellGap: 0,
    pieceColor: '#007bff',
    pieceBorderColor: '#0056b3',
    pieceBorderWidth: 2,
    lockedPieceColor: '#28a745',
    lockedPieceBorderColor: '#1e7e34',
    boardBorderColor: '#999',
    boardBorderLightColor: '#ccc',
    hoverColor: '#f0f0f0',
    activeColor: '#e0e0e0',
    disabledColor: '#ccc',
    highlightColor: '#ffeb3b',
    invalidDropColor: 'rgba(220, 53, 69, 0.5)',
    invalidDropBorderColor: '#dc3545',
    backgroundTertiary: '#eee',
};

// Dark theme game tokens
const darkGameTokens = {
    cellSize: 50,
    cellGap: 0,
    pieceColor: '#3391ff',
    pieceBorderColor: '#1a7fff',
    pieceBorderWidth: 2,
    lockedPieceColor: '#2ea043',
    lockedPieceBorderColor: '#238636',
    boardBorderColor: '#666',
    boardBorderLightColor: '#444',
    hoverColor: '#3d3d3d',
    activeColor: '#4d4d4d',
    disabledColor: '#555',
    highlightColor: '#ffeb3b',
    invalidDropColor: 'rgba(255, 82, 82, 0.4)',
    invalidDropBorderColor: '#ff5252',
    backgroundTertiary: '#333333',
};

// Light theme palette (matching existing CSS variables)
const lightPalette: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: '#007bff',
            dark: '#0056b3',
        },
        secondary: {
            main: '#6c757d',
        },
        success: {
            main: '#28a745',
            dark: '#1e7e34',
        },
        error: {
            main: '#dc3545',
        },
        background: {
            default: '#fff',
            paper: '#f5f5f5',
        },
        text: {
            primary: '#333',
        },
    },
    game: lightGameTokens,
};

// Dark theme palette (matching existing CSS variables)
const darkPalette: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#3391ff',
            dark: '#1a7fff',
        },
        secondary: {
            main: '#adb5bd',
        },
        success: {
            main: '#2ea043',
            dark: '#238636',
        },
        error: {
            main: '#f85149',
        },
        background: {
            default: '#1a1a1a',
            paper: '#2d2d2d',
        },
        text: {
            primary: '#ffffff',
        },
    },
    game: darkGameTokens,
};

// Shared theme options
const sharedOptions: ThemeOptions = {
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            'Oxygen',
            'Ubuntu',
            'Cantarell',
            '"Open Sans"',
            '"Helvetica Neue"',
            'sans-serif',
        ].join(','),
    },
    shape: {
        borderRadius: 4,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
            },
            defaultProps: {
                disableElevation: true,
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                },
            },
        },
    },
};

export const lightTheme = createTheme({
    ...sharedOptions,
    ...lightPalette,
});

export const darkTheme = createTheme({
    ...sharedOptions,
    ...darkPalette,
});

export type ThemeMode = 'light' | 'dark';
