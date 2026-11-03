/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { BaseDialog } from "../../src/client/components/BaseDialog";
import { ProgressBarWithLabel } from "../../src/client/components/ProgressBarWithLabel";
import { darkTheme, lightTheme } from "../../src/client/theme/theme";

const withTheme = (theme: Theme, child: React.ReactElement) => React.createElement(ThemeProvider, { theme }, child);

const paperOf = (props: Partial<React.ComponentProps<typeof BaseDialog>>, theme: Theme = lightTheme) => {
    render(withTheme(theme, React.createElement(BaseDialog, { open: true, ...props }, "Body")));
    return screen.getByRole("dialog");
};

describe("BaseDialog", () => {
    it("applies a caller's function sx to the paper", () => {
        const paper = paperOf({ slotProps: { paper: { sx: () => ({ outlineWidth: "7px" }) } } });
        expect(getComputedStyle(paper).outlineWidth).toBe("7px");
    });

    it("applies a caller's object sx and keeps its own text selection rule", () => {
        const paper = paperOf({ slotProps: { paper: { sx: { outlineWidth: "7px" } } } });
        expect(getComputedStyle(paper).outlineWidth).toBe("7px");
        expect(getComputedStyle(paper).userSelect).toBe("none");
    });

    it("uses the narrow width for a compact dialog", () => {
        expect(paperOf({ size: "compact" }).className).toContain("MuiDialog-paperWidthXs");
    });

    it("uses the standard width by default", () => {
        expect(paperOf({}).className).toContain("MuiDialog-paperWidthSm");
    });

    it.each([["light", lightTheme], ["dark", darkTheme]] as const)("draws a flat paper with 8px corners in the %s theme", (_name, theme) => {
        const style = getComputedStyle(paperOf({}, theme));
        expect(style.backgroundImage).toBe("none");
        expect(style.boxShadow).toBe("none");
        expect(style.borderRadius).toBe("8px");
    });
});

describe("ProgressBarWithLabel", () => {
    const renderBar = (value: number, theme: Theme) => {
        render(withTheme(theme, React.createElement(ProgressBarWithLabel, { value, label: "6 / 366" })));
        return screen.getAllByText("6 / 366");
    };

    it("colours the base label for the track in light", () => {
        expect(getComputedStyle(renderBar(2, lightTheme)[0]).color).toBe("rgb(51, 51, 51)");
    });

    it("colours the base label for the track in dark", () => {
        expect(getComputedStyle(renderBar(2, darkTheme)[0]).color).toBe("rgb(255, 255, 255)");
    });

    it("clips the second label to the filled part", () => {
        const fillLabel = renderBar(25, lightTheme)[1];
        expect(fillLabel.style.clipPath).toBe("inset(0 75% 0 0)");
        expect(fillLabel).toHaveAttribute("aria-hidden", "true");
    });
});
