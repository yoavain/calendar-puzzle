/* eslint-disable max-len */
import React from "react";
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useColorMode } from "../theme/ColorModeContext";

// Visually hidden label for accessibility
const VisuallyHiddenLabel = styled("span")({
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0
});

// Custom styled switch with sun/moon theme
const ThemeSwitch = styled(Switch)(({ theme }) => ({
    width: 62,
    height: 34,
    padding: 7,
    "& .MuiSwitch-switchBase": {
        margin: 1,
        padding: 0,
        transform: "translateX(6px)",
        "&.Mui-checked": {
            color: "#fff",
            transform: "translateX(22px)",
            "& .MuiSwitch-thumb:before": {
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent("#fff")}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`
            },
            "& + .MuiSwitch-track": {
                opacity: 1,
                backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be"
            }
        }
    },
    "& .MuiSwitch-thumb": {
        backgroundColor: theme.palette.mode === "dark" ? "#003892" : "#ffc107",
        width: 32,
        height: 32,
        transition: "background-color 0.3s ease",
        "&::before": {
            content: "''",
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent("#fff")}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`
        }
    },
    "& .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
        borderRadius: 20 / 2,
        transition: "background-color 0.3s ease"
    }
}));

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
    const { effectiveMode, toggleColorMode } = useColorMode();
    const isDark = effectiveMode === "dark";

    return (
        <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            className={className}
        >
            <LightModeIcon
                sx={(theme) => ({
                    color: isDark ? "text.disabled" : "warning.main",
                    fontSize: theme.game.fontSize.lg,
                    transition: "color 0.25s ease, transform 0.25s ease",
                    transform: isDark ? "scale(0.9)" : "scale(1.1)"
                })}
            />
            <FormControlLabel
                control={
                    <ThemeSwitch
                        checked={isDark}
                        onChange={toggleColorMode}
                    />
                }
                label={<VisuallyHiddenLabel>Toggle dark mode</VisuallyHiddenLabel>}
                sx={{ margin: 0, gap: 0, "& .MuiFormControlLabel-label": { margin: 0 } }}
            />
            <DarkModeIcon
                sx={(theme) => ({
                    color: isDark ? "primary.main" : "text.disabled",
                    fontSize: theme.game.fontSize.lg,
                    transition: "color 0.25s ease, transform 0.25s ease",
                    transform: isDark ? "scale(1.1)" : "scale(0.9)"
                })}
            />
        </Box>
    );
};

export default ThemeToggle;
