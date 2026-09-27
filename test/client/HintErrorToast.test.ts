/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { HintErrorToast } from "../../src/client/components/HintErrorToast";
import { lightTheme } from "../../src/client/theme/theme";

const renderToast = (message: string | null) => {
    const onClose = jest.fn();
    render(React.createElement(ThemeProvider, { theme: lightTheme }, React.createElement(HintErrorToast, { message, onClose })));
    return { onClose };
};

describe("HintErrorToast", () => {
    it("shows the message", () => {
        renderToast("No hint tokens left. Solve another date to earn one.");
        expect(screen.getByText("No hint tokens left. Solve another date to earn one.")).toBeInTheDocument();
    });

    it("renders nothing without a message", () => {
        renderToast(null);
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("closes from its close button", () => {
        const { onClose } = renderToast("Something failed");
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(onClose).toHaveBeenCalled();
    });
});
