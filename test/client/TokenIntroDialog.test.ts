/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { TokenIntroDialog } from "../../src/client/components/TokenIntroDialog";
import { lightTheme } from "../../src/client/theme/theme";
import { HINT_TOKEN_COPY } from "../../src/client/copy/hintTokenCopy";

const copy = HINT_TOKEN_COPY.intro;

const renderDialog = (tokenBalance: number, solvedCount: number) => {
    const onClose = jest.fn();
    render(React.createElement(
        ThemeProvider,
        { theme: lightTheme },
        React.createElement(TokenIntroDialog, { open: true, tokenBalance, solvedCount, onClose })
    ));
    return { onClose };
};

describe("TokenIntroDialog", () => {
    it("shows the three steps and the free-first-hint rule", () => {
        renderDialog(0, 0);
        for (const step of copy.steps) {
            expect(screen.getByText(step)).toBeInTheDocument();
        }
        expect(screen.getByText(copy.firstHintFree)).toBeInTheDocument();
    });

    it("tells an existing user their starting balance", () => {
        renderDialog(12, 12);
        expect(screen.getByText(copy.startingBalance(12))).toBeInTheDocument();
    });

    it("tells a new user how to earn the first token", () => {
        renderDialog(0, 0);
        expect(screen.getByText(copy.newUser)).toBeInTheDocument();
    });

    it("shows the current balance when reopened after tokens were spent", () => {
        renderDialog(5, 12);
        expect(screen.getByText(copy.balance(5))).toBeInTheDocument();
    });

    it("closes from its button", () => {
        const { onClose } = renderDialog(1, 1);
        fireEvent.click(screen.getByRole("button", { name: copy.close }));
        expect(onClose).toHaveBeenCalled();
    });
});
