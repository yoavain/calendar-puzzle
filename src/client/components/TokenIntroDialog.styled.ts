import { styled } from "@mui/material/styles";

// Three steps with arrows between them: step, arrow, step, arrow, step
export const Steps = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr",
    alignItems: "center",
    gap: theme.spacing(0.5),
    textAlign: "center",
    fontSize: theme.game.fontSize.sm
}));

export const Step = styled("div")(({ theme }) => ({
    display: "grid",
    justifyItems: "center",
    gap: theme.spacing(0.75)
}));

export const StepIcon = styled("span")(({ theme }) => ({
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.game.boardBorderLightColor}`,
    "& > svg": {
        fontSize: 22,
        color: theme.palette.primary.main
    }
}));

export const StepArrow = styled("span")(({ theme }) => ({
    color: theme.palette.text.secondary
}));

export const BalanceCallout = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.25),
    padding: theme.spacing(1.25, 1.5),
    borderRadius: theme.game.radius.sm,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.game.boardBorderLightColor}`,
    fontWeight: 600
}));
