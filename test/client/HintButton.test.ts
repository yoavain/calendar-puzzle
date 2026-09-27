/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { HintButton } from "../../src/client/components/HintButton";
import { lightTheme } from "../../src/client/theme/theme";
import { HINT_TOKEN_COPY } from "../../src/client/copy/hintTokenCopy";
import type { HintAvailability } from "../../src/common/hintTokens";

const renderButton = (availability: HintAvailability, tokenBalance = 2) =>
    render(React.createElement(
        ThemeProvider,
        { theme: lightTheme },
        React.createElement(HintButton, { onHint: jest.fn(), availability, tokenBalance })
    ));

describe("HintButton", () => {
    it.each<HintAvailability>(["free", "token"])("is enabled when availability is %s", (availability) => {
        renderButton(availability);
        expect(screen.getByRole("button", { name: new RegExp(HINT_TOKEN_COPY.hintButton[availability].label, "i") })).toBeEnabled();
    });

    it.each<HintAvailability>(["login-required", "solved", "loading", "max-reached", "own-pieces", "no-tokens", "date-solved"])(
        "is disabled when availability is %s",
        (availability) => {
            renderButton(availability);
            expect(screen.getByRole("button")).toBeDisabled();
        }
    );

    it("shows the balance inside the button, on the flight target", () => {
        const { container } = renderButton("token", 5);
        const target = container.querySelector("[data-token-target]");
        expect(target).not.toBeNull();
        expect(target).toHaveTextContent("5");
    });

    it("shows no balance when signed out", () => {
        const { container } = renderButton("login-required", 0);
        expect(container.querySelector("[data-token-target]")).toBeNull();
    });

    it("shows the loading label while a hint request runs", () => {
        renderButton("loading");
        expect(screen.getByRole("button")).toHaveTextContent(HINT_TOKEN_COPY.hintButton.loading.label);
    });
});
