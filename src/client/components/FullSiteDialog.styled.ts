import { styled } from "@mui/material/styles";
import { RankRow } from "./HallOfFameModal.styled";

/**
 * A phone on its side. kamario.games leaves the game about 245px of height there,
 * so the Hall of Fame preview moves beside the text.
 */
const SHORT_AND_WIDE = "@media (max-height: 500px) and (min-width: 560px)";

/** The smallest phones, upright. Less space around things keeps the dialog from scrolling. */
const NARROW = "@media (max-width: 359px)";

export const paperSx = {
    [SHORT_AND_WIDE]: {
        maxWidth: 700,
        "& .MuiDialogTitle-root": { paddingTop: 1, paddingBottom: 0.5 },
        "& .MuiDialogContent-root": { paddingBottom: 0.5 },
        "& .MuiDialogActions-root": { paddingTop: 0.5, paddingBottom: 1 }
    }
};

export const Body = styled("div")(({ theme }) => ({
    display: "grid",
    gap: theme.spacing(1.5),
    [NARROW]: { gap: theme.spacing(1) },
    [SHORT_AND_WIDE]: {
        gridTemplateColumns: "minmax(0, 1fr) 220px",
        gridTemplateAreas: "\"intro fame\" \"hint fame\"",
        alignContent: "start",
        gap: theme.spacing(0.5, 2)
    }
}));

export const Intro = styled("div")(({ theme }) => ({
    [SHORT_AND_WIDE]: {
        gridArea: "intro",
        "& .MuiTypography-root": { fontSize: theme.game.fontSize.sm, lineHeight: 1.35 }
    }
}));

export const FamePreview = styled("div")(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.game.radius.md,
    padding: theme.spacing(1),
    [NARROW]: { padding: theme.spacing(0.5) },
    [SHORT_AND_WIDE]: {
        gridArea: "fame",
        padding: theme.spacing(0.5)
    }
}));

export const FameHead = styled("div")(({ theme }) => ({
    display: "flex",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    padding: theme.spacing(0, 1, 0.5),
    fontSize: theme.game.fontSize.xs,
    color: theme.palette.text.secondary,
    "& strong": { color: theme.palette.text.primary },
    [SHORT_AND_WIDE]: {
        padding: theme.spacing(0, 0.5),
        // The column is too narrow for both labels.
        "& span": { display: "none" }
    }
}));

/** A Hall of Fame row, with less space around it */
export const FameRow = styled(RankRow)(({ theme }) => ({
    gridTemplateColumns: "28px 28px minmax(0, 1fr) auto",
    padding: theme.spacing(0.5, 1),
    [NARROW]: { padding: theme.spacing(0.25, 0.5) },
    [SHORT_AND_WIDE]: {
        padding: theme.spacing(0.125, 0.5)
    }
}));

export const HintPreview = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    [SHORT_AND_WIDE]: {
        gridArea: "hint",
        gap: theme.spacing(1)
    }
}));

/** Looks like the Hint button. It is a picture, so it takes no click and no focus. */
export const MockHintButton = styled("span")(({ theme }) => ({
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    height: theme.game.toolbarButtonHeight,
    padding: theme.spacing(0, 1.5),
    borderRadius: theme.game.radius.sm,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontSize: "0.8125rem",
    fontWeight: 500,
    "& > svg": { fontSize: 18, marginRight: theme.spacing(1) }
}));
