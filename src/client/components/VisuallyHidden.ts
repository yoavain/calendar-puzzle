import { styled } from "@mui/material/styles";

/** Text for screen readers only. */
export const VisuallyHidden = styled("span")({
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap"
});
