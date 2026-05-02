import type { ThemeOptions } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

// Extend MUI theme interface with custom game tokens
// Note: Piece colors are now in src/common/pieceData.ts
interface GameFontSizeTokens {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
}

// Game-level border-radius tokens (pixels). `board` is a deliberate one-off
// carried over from the original visual design — the playing surface uses a
// larger radius than the rest of the UI to read as a physical object.
interface GameRadiusTokens {
    sm: number;
    md: number;
    lg: number;
    pill: number;
    board: number;
}

// Game-level color tokens that don't belong to the MUI palette: progress-bar
// thresholds, medal ranks, on-piece text, and the theme-switch pill.
interface GameColorTokens {
    progress: {
        track: string;
        low: string;
        medium: string;
        high: string;
        complete: string;
    };
    medal: {
        gold: string;
        silver: string;
        bronze: string;
    };
    onPieceText: string;
    switch: {
        track: string;
        thumb: string;
    };
}

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
            toolbarButtonHeight: number;
            fontSize: GameFontSizeTokens;
            radius: GameRadiusTokens;
            colors: GameColorTokens;
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
            toolbarButtonHeight?: number;
            fontSize?: GameFontSizeTokens;
            radius?: GameRadiusTokens;
            colors?: GameColorTokens;
        };
    }
}

// Game-level font-size tokens (4px step scale around a 16px root)
const gameFontSizeTokens: GameFontSizeTokens = {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    md: "1rem", // 16px
    lg: "1.25rem", // 20px
    xl: "1.5rem" // 24px
};

// Game-level border-radius tokens. `board` is intentionally distinct: the
// playing surface and the landing-page 3D slab use the same larger radius.
const gameRadiusTokens: GameRadiusTokens = {
    sm: 4,
    md: 8,
    lg: 16,
    pill: 999,
    board: 22
};

// Shared height (px) for buttons in the desktop top toolbar. Aligns text
// buttons (Solution, Date, Hint, Undo/Redo/Reset) with icon-only buttons so
// they share a single visual baseline.
const toolbarButtonHeight = 32;

// Progress-bar threshold + medal + on-piece colors are theme-invariant: they
// communicate status/rank and should read the same in both modes. The switch
// pill inverts between modes so the moon/sun affordance stays legible.
const sharedGameColorTokens = {
    progress: {
        low: "#dc3545",
        medium: "#f59e0b",
        high: "#84cc16",
        complete: "#22c55e"
    },
    medal: {
        gold: "#FFD700",
        silver: "#C0C0C0",
        bronze: "#CD7F32"
    },
    onPieceText: "#ffffff"
};

const lightGameColorTokens: GameColorTokens = {
    ...sharedGameColorTokens,
    progress: {
        track: "#e0e0e0",
        ...sharedGameColorTokens.progress
    },
    switch: {
        track: "#aab4be",
        thumb: "#ffc107"
    }
};

const darkGameColorTokens: GameColorTokens = {
    ...sharedGameColorTokens,
    progress: {
        track: "#333333",
        ...sharedGameColorTokens.progress
    },
    switch: {
        track: "#8796A5",
        thumb: "#003892"
    }
};

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
    extensionColor: "#7c3aed",
    toolbarButtonHeight,
    fontSize: gameFontSizeTokens,
    radius: gameRadiusTokens,
    colors: lightGameColorTokens
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
    extensionColor: "#7c3aed",
    toolbarButtonHeight,
    fontSize: gameFontSizeTokens,
    radius: gameRadiusTokens,
    colors: darkGameColorTokens
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
        ].join(","),
        h1: { fontSize: "3rem", fontWeight: 600, lineHeight: 1.2 },
        h2: { fontSize: "2.5rem", fontWeight: 600, lineHeight: 1.2 },
        h3: { fontSize: "2rem", fontWeight: 600, lineHeight: 1.25 },
        h4: { fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.3 },
        h5: { fontSize: gameFontSizeTokens.xl, fontWeight: 600, lineHeight: 1.35 },
        h6: { fontSize: gameFontSizeTokens.lg, fontWeight: 600, lineHeight: 1.5 },
        subtitle1: { fontSize: gameFontSizeTokens.md, fontWeight: 500, lineHeight: 1.5 },
        subtitle2: { fontSize: gameFontSizeTokens.sm, fontWeight: 500, lineHeight: 1.5 },
        body1: { fontSize: gameFontSizeTokens.md, fontWeight: 400, lineHeight: 1.5 },
        body2: { fontSize: gameFontSizeTokens.sm, fontWeight: 400, lineHeight: 1.5 },
        caption: { fontSize: gameFontSizeTokens.xs, fontWeight: 400, lineHeight: 1.5 },
        button: { fontSize: gameFontSizeTokens.sm, fontWeight: 500, lineHeight: 1.5 },
        overline: { fontSize: gameFontSizeTokens.xs, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 2 }
    },
    shape: {
        borderRadius: gameRadiusTokens.sm
    },
    components: {
        MuiButtonBase: {
            styleOverrides: {
                root: ({ theme }) => ({
                    "&:focus-visible": {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: 2
                    }
                })
            }
        },
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
                    borderRadius: gameRadiusTokens.sm
                }
            }
        },
        // MUI Switch renders its hit target via MuiButtonBase. The default
        // ThemeSwitch overrides translate the thumb, which pushes the focus
        // ring off-center; clip the ring to the visible switchBase so it
        // reads as a highlight around the thumb instead of empty space.
        MuiSwitch: {
            styleOverrides: {
                switchBase: ({ theme }) => ({
                    "&.Mui-focusVisible .MuiSwitch-thumb": {
                        boxShadow: `0 0 0 2px ${theme.palette.primary.main}`
                    }
                })
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
