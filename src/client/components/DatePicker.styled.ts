import { alpha, styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import ButtonBase from "@mui/material/ButtonBase";

export type DayStatus = "none" | "solved" | "started";

const statusFill = (theme: Theme, status: DayStatus) => {
    if (status === "solved") {
        return { background: theme.palette.success.main, color: theme.palette.success.contrastText };
    }
    if (status === "started") {
        return { background: theme.game.extensionColor, color: theme.palette.getContrastText(theme.game.extensionColor) };
    }
    return { background: theme.palette.background.default, color: theme.palette.text.primary };
};

// The board's lines show through a 1px gap between the tiles.
export const DayFelt = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 1,
    padding: 1,
    backgroundColor: theme.game.boardBorderColor,
    borderRadius: theme.game.radius.md,
    overflow: "hidden"
}));

export const EmptyTile = styled("div")(({ theme }) => ({
    backgroundColor: theme.game.backgroundTertiary
}));

interface DayTileProps {
    status: DayStatus;
    isToday: boolean;
    isSelected: boolean;
}

export const DayTile = styled(ButtonBase, {
    shouldForwardProp: (prop) => prop !== "status" && prop !== "isToday" && prop !== "isSelected"
})<DayTileProps>(({ theme, status, isToday, isSelected }) => {
    const band = theme.palette.background.default;
    const fill = isToday
        ? { background: theme.game.highlightColor, color: theme.game.highlightTextColor }
        : statusFill(theme, status);

    return {
        position: "relative",
        aspectRatio: "1",
        backgroundColor: fill.background,
        color: fill.color,
        fontSize: theme.game.fontSize.sm,
        fontWeight: 700,
        // The band keeps the ring readable on the green and violet tiles.
        boxShadow: isSelected ? `inset 0 0 0 3px ${theme.palette.text.primary}, inset 0 0 0 5px ${band}` : "none",
        "@media (hover: hover)": {
            "&:hover": {
                backgroundImage: `linear-gradient(${theme.palette.action.selected}, ${theme.palette.action.selected})`
            }
        },
        // DayFelt clips its corners, so the focus outline goes inside the tile.
        "&:focus-visible": {
            outlineOffset: -2,
            boxShadow: isSelected ? `inset 0 0 0 3px ${theme.palette.text.primary}, inset 0 0 0 5px ${band}` : `inset 0 0 0 4px ${band}`
        }
    };
});

// Today's yellow hides the status colour, so a small mark carries it.
export const TodayStatusMark = styled("span", {
    shouldForwardProp: (prop) => prop !== "status"
})<{ status: DayStatus }>(({ theme, status }) => ({
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: statusFill(theme, status).background
}));

export const Legend = styled("div")(({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5, 2),
    marginTop: theme.spacing(1.25),
    fontSize: theme.game.fontSize.xs,
    color: theme.palette.text.secondary
}));

export const LegendItem = styled("span")(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(0.75)
}));

const LegendSwatch = styled("span")(({ theme }) => ({
    width: 12,
    height: 12,
    borderRadius: theme.game.radius.sm,
    border: `1px solid ${alpha(theme.palette.text.primary, 0.23)}`
}));

export const SolvedSwatch = styled(LegendSwatch)(({ theme }) => ({
    backgroundColor: statusFill(theme, "solved").background
}));

export const StartedSwatch = styled(LegendSwatch)(({ theme }) => ({
    backgroundColor: statusFill(theme, "started").background
}));

export const TodaySwatch = styled(LegendSwatch)(({ theme }) => ({
    backgroundColor: theme.game.highlightColor
}));
