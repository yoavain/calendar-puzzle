import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiButton from "@mui/material/Button";

/**
 * Height of the mobile toolbar in pixels (horizontal layout).
 */
export const MOBILE_TOOLBAR_HEIGHT = 56;

export type ToolbarOrientation = "horizontal" | "vertical";

/**
 * Container for the mobile toolbar.
 * Horizontal: full-width bar. Vertical: narrow strip (e.g. landscape left column).
 */
export const ToolbarContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== "orientation"
})<{ orientation?: ToolbarOrientation }>(({ theme, orientation }) => ({
    display: "flex",
    flexDirection: orientation === "vertical" ? "column" : "row",
    alignItems: orientation === "vertical" ? "center" : "center",
    justifyContent: orientation === "vertical" ? "flex-start" : "space-between",
    gap: orientation === "vertical" ? theme.spacing(1) : 0,
    padding: orientation === "vertical" ? theme.spacing(1, 0.5) : theme.spacing(1, 2),
    ...(orientation === "vertical"
        ? {
            width: "100%",
            minHeight: MOBILE_TOOLBAR_HEIGHT,
            borderBottom: "none"
        }
        : {
            height: MOBILE_TOOLBAR_HEIGHT,
            borderBottom: `1px solid ${theme.palette.divider}`
        }),
    backgroundColor: theme.palette.background.paper,
    flexShrink: 0
}));

/**
 * Left section of toolbar (theme toggle, user menu).
 * Stacks vertically when orientation is vertical.
 */
export const ToolbarLeft = styled(Box, {
    shouldForwardProp: (prop) => prop !== "orientation"
})<{ orientation?: ToolbarOrientation }>(({ orientation }) => ({
    display: "flex",
    flexDirection: orientation === "vertical" ? "column" : "row",
    alignItems: "center",
    gap: 4
}));

/**
 * Center section of toolbar (game actions: undo, redo, reset).
 * Stacks vertically when orientation is vertical.
 */
export const ToolbarCenter = styled(Box, {
    shouldForwardProp: (prop) => prop !== "orientation"
})<{ orientation?: ToolbarOrientation }>(({ orientation }) => ({
    display: "flex",
    flexDirection: orientation === "vertical" ? "column" : "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    ...(orientation === "vertical" ? {} : { flex: 1 })
}));

/**
 * Right section of toolbar (hamburger menu).
 * Stacks vertically when orientation is vertical.
 */
export const ToolbarRight = styled(Box, {
    shouldForwardProp: (prop) => prop !== "orientation"
})<{ orientation?: ToolbarOrientation }>(({ orientation }) => ({
    display: "flex",
    flexDirection: orientation === "vertical" ? "column" : "row",
    alignItems: "center",
    gap: 4
}));

/**
 * Content container for the hamburger menu drawer.
 */
export const DrawerContent = styled(Box)(({ theme }) => ({
    width: 220,
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1)
}));

/**
 * Header section of the drawer.
 */
export const DrawerHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`
}));

/**
 * Section within the drawer for grouping related actions.
 */
export const DrawerSection = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2)
}));

/**
 * Drawer button with left-aligned icon + text.
 */
export const DrawerButton = styled(MuiButton)(({ theme }) => ({
    justifyContent: "flex-start",
    paddingLeft: theme.spacing(3),
    gap: theme.spacing(1.5)
}));
