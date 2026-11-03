import { alpha, styled } from "@mui/material/styles";

const ROW_GAP_SPACING = 1.5;

export const ScoreCaption = styled("div")(({ theme }) => ({
    textAlign: "end",
    padding: theme.spacing(0, ROW_GAP_SPACING, 0.5),
    fontSize: theme.game.fontSize.xs,
    color: theme.palette.text.secondary
}));

export const RankList = styled("ol")(({ theme }) => ({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: theme.spacing(0.25)
}));

export const RankRow = styled("li", {
    shouldForwardProp: (prop) => prop !== "isCurrentUser"
})<{ isCurrentUser: boolean }>(({ theme, isCurrentUser }) => ({
    display: "grid",
    gridTemplateColumns: "28px 32px minmax(0, 1fr) auto",
    alignItems: "center",
    gap: theme.spacing(ROW_GAP_SPACING),
    padding: theme.spacing(1, ROW_GAP_SPACING),
    borderRadius: theme.game.radius.sm,
    backgroundColor: isCurrentUser
        ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.08)
        : "transparent"
}));

const medalColor = (rank: number, medal: { gold: string; silver: string; bronze: string }): string | undefined => {
    return [medal.gold, medal.silver, medal.bronze][rank - 1];
};

export const RankMarker = styled("span", {
    shouldForwardProp: (prop) => prop !== "rank"
})<{ rank: number }>(({ theme, rank }) => {
    const medal = medalColor(rank, theme.game.colors.medal);

    return {
        width: 28,
        height: 28,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        fontSize: theme.game.fontSize.sm,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        // Medals look the same in both themes, so their text does too.
        backgroundColor: medal ?? "transparent",
        color: medal ? theme.game.highlightTextColor : theme.palette.text.secondary
    };
});

export const PlayerCell = styled("span")(({ theme }) => ({
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    fontSize: theme.game.fontSize.sm,
    fontWeight: 500
}));

export const Score = styled("span")(({ theme }) => ({
    textAlign: "end",
    fontSize: theme.game.fontSize.lg,
    fontWeight: 600,
    lineHeight: 1.1,
    fontVariantNumeric: "tabular-nums"
}));

export const ScoreDetail = styled("span")(({ theme }) => ({
    display: "block",
    fontSize: theme.game.fontSize.xs,
    fontWeight: 400,
    lineHeight: 1.5,
    color: theme.palette.text.secondary
}));

export const VisuallyHidden = styled("span")({
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap"
});
