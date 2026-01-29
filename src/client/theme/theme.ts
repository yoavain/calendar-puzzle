import type { ThemeOptions } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

// Extend MUI theme interface with custom game tokens
// Note: Piece colors are now in src/common/pieceData.ts
declare module "@mui/material/styles" {
    interface Theme {
        game: {
            cellSize: number;
            cellSizePx: string;
            cellGap: number;
            pieceBorderWidth: number;
            hintedOpacity: number;
            solutionRevealedOpacity: number;
            boardBorderColor: string;
            boardBorderLightColor: string;
            hoverColor: string;
            activeColor: string;
            disabledColor: string;
            highlightColor: string;
            highlightTextColor: string;
            invalidDropColor: string;
            invalidDropBorderColor: string;
            backgroundTertiary: string;
            starColor: string;
            extensionColor: string;
        };
    }
    interface ThemeOptions {
        game?: {
            cellSize?: number;
            cellSizePx?: string;
            cellGap?: number;
            pieceBorderWidth?: number;
            hintedOpacity?: number;
            solutionRevealedOpacity?: number;
            boardBorderColor?: string;
            boardBorderLightColor?: string;
            hoverColor?: string;
            activeColor?: string;
            disabledColor?: string;
            highlightColor?: string;
            highlightTextColor?: string;
            invalidDropColor?: string;
            invalidDropBorderColor?: string;
            backgroundTertiary?: string;
            starColor?: string;
            extensionColor?: string;
        };
    }
}

// Light theme game tokens
const lightGameTokens = {
    cellSize: 50,
    cellSizePx: "50px",
    cellGap: 0,
    pieceBorderWidth: 2,
    hintedOpacity: 0.7,
    solutionRevealedOpacity: 0.85,
    boardBorderColor: "#999",
    boardBorderLightColor: "#ccc",
    hoverColor: "#f0f0f0",
    activeColor: "#e0e0e0",
    disabledColor: "#ccc",
    highlightColor: "#ffeb3b",
    highlightTextColor: "rgba(0, 0, 0, 0.87)",
    invalidDropColor: "rgba(220, 53, 69, 0.5)",
    invalidDropBorderColor: "#dc3545",
    backgroundTertiary: "#eee",
    starColor: "#ffb74d",
    extensionColor: "#7c3aed"
};

// Dark theme game tokens
const darkGameTokens = {
    cellSize: 50,
    cellSizePx: "50px",
    cellGap: 0,
    pieceBorderWidth: 2,
    hintedOpacity: 0.7,
    solutionRevealedOpacity: 0.85,
    boardBorderColor: "#666",
    boardBorderLightColor: "#444",
    hoverColor: "#3d3d3d",
    activeColor: "#4d4d4d",
    disabledColor: "#555",
    highlightColor: "#ffeb3b",
    highlightTextColor: "rgba(0, 0, 0, 0.87)",
    invalidDropColor: "rgba(255, 82, 82, 0.4)",
    invalidDropBorderColor: "#ff5252",
    backgroundTertiary: "#333333",
    starColor: "#ffb74d",
    extensionColor: "#7c3aed"
};

// Light theme palette (matching existing CSS variables)
const lightPalette: ThemeOptions = {
    palette: {
        mode: "light",
        primary: {
            main: "#0550ae",
            dark: "#033d8b",
            contrastText: "#ffffff"
        },
        secondary: {
            main: "#6c757d"
        },
        success: {
            main: "#1a7f37",
            dark: "#116329"
        },
        error: {
            main: "#dc3545"
        },
        background: {
            default: "#fff",
            paper: "#f5f5f5"
        },
        text: {
            primary: "#333"
        }
    },
    game: lightGameTokens
};

// Dark theme palette (matching existing CSS variables)
const darkPalette: ThemeOptions = {
    palette: {
        mode: "dark",
        primary: {
            main: "#58a6ff", // Lighter blue for dark mode accessibility (4.5:1 contrast ratio)
            dark: "#1158c7",
            contrastText: "#000000"
        },
        secondary: {
            main: "#adb5bd"
        },
        success: {
            main: "#238636",
            dark: "#196c2e"
        },
        error: {
            main: "#f85149"
        },
        background: {
            default: "#1a1a1a",
            paper: "#2d2d2d"
        },
        text: {
            primary: "#ffffff"
        }
    },
    game: darkGameTokens
};

// Shared theme options
const sharedOptions: ThemeOptions = {
    typography: {
        fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            "\"Segoe UI\"",
            "Roboto",
            "Oxygen",
            "Ubuntu",
            "Cantarell",
            "\"Open Sans\"",
            "\"Helvetica Neue\"",
            "sans-serif"
        ].join(",")
    },
    shape: {
        borderRadius: 4
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 500
                },
                contained: {
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "none"
                    }
                }
            },
            defaultProps: {
                disableElevation: true
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4
                }
            }
        }
    }
};

export const lightTheme = createTheme({
    ...sharedOptions,
    ...lightPalette
});

export const darkTheme = createTheme({
    ...sharedOptions,
    ...darkPalette
});

export type ThemeMode = "light" | "dark" | "system";
