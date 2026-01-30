import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

/**
 * Height of the mobile toolbar in pixels.
 */
export const MOBILE_TOOLBAR_HEIGHT = 56;

/**
 * Container for the mobile toolbar.
 * Fixed height, horizontal layout with space between items.
 */
export const ToolbarContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1, 2),
    height: MOBILE_TOOLBAR_HEIGHT,
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    flexShrink: 0
}));

/**
 * Left section of toolbar (theme toggle, user menu).
 */
export const ToolbarLeft = styled(Box)({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4
});

/**
 * Center section of toolbar (game actions: undo, redo, reset).
 */
export const ToolbarCenter = styled(Box)({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    flex: 1
});

/**
 * Right section of toolbar (hamburger menu).
 */
export const ToolbarRight = styled(Box)({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4
});

/**
 * Content container for the hamburger menu drawer.
 */
export const DrawerContent = styled(Box)(({ theme }) => ({
    width: 280,
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
 * Section title in the drawer.
 */
export const DrawerSectionTitle = styled(Box)(({ theme }) => ({
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5)
}));
