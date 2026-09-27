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

const dialog = (tokenBalance: number, solvedCount: number, isFirstView: boolean, onClose: () => void) =>
    React.createElement(
        ThemeProvider,
        { theme: lightTheme },
        React.createElement(TokenIntroDialog, { open: true, tokenBalance, solvedCount, isFirstView, onClose })
    );

const renderDialog = (tokenBalance: number, solvedCount: number, isFirstView = true) => {
    const onClose = jest.fn();
    const view = render(dialog(tokenBalance, solvedCount, isFirstView, onClose));
    return { onClose, view };
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
        renderDialog(5, 12, false);
        expect(screen.getByText(copy.balance(5))).toBeInTheDocument();
    });

    it("shows the current balance when reopened, even if it happens to equal the solved count", () => {
        renderDialog(12, 12, false);
        expect(screen.getByText(copy.balance(12))).toBeInTheDocument();
    });

    it("keeps the first-view line while it closes (the seen flag flips on close)", () => {
        const onClose = jest.fn();
        const { view } = renderDialog(12, 12, true);
        view.rerender(dialog(12, 12, false, onClose));
        expect(screen.getByText(copy.startingBalance(12))).toBeInTheDocument();
    });

    it("closes from its button", () => {
        const { onClose } = renderDialog(1, 1);
        fireEvent.click(screen.getByRole("button", { name: copy.close }));
        expect(onClose).toHaveBeenCalled();
    });
});
