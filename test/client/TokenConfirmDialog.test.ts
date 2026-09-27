/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { TokenConfirmDialog } from "../../src/client/components/TokenConfirmDialog";
import { lightTheme } from "../../src/client/theme/theme";
import { HINT_TOKEN_COPY } from "../../src/client/copy/hintTokenCopy";

const renderDialog = () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(React.createElement(
        ThemeProvider,
        { theme: lightTheme },
        React.createElement(TokenConfirmDialog, { open: true, tokenBalance: 3, onConfirm, onCancel })
    ));
    return { onConfirm, onCancel };
};

describe("TokenConfirmDialog", () => {
    it("confirms without don't-ask-again by default", () => {
        const { onConfirm } = renderDialog();
        fireEvent.click(screen.getByRole("button", { name: HINT_TOKEN_COPY.confirm.confirm }));
        expect(onConfirm).toHaveBeenCalledWith(false);
    });

    it("passes don't-ask-again when ticked", () => {
        const { onConfirm } = renderDialog();
        fireEvent.click(screen.getByRole("checkbox", { name: HINT_TOKEN_COPY.confirm.dontAskAgain }));
        fireEvent.click(screen.getByRole("button", { name: HINT_TOKEN_COPY.confirm.confirm }));
        expect(onConfirm).toHaveBeenCalledWith(true);
    });

    it("cancels without spending", () => {
        const { onConfirm, onCancel } = renderDialog();
        fireEvent.click(screen.getByRole("button", { name: HINT_TOKEN_COPY.confirm.cancel }));
        expect(onCancel).toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("shows the cost, the balance and how to earn more", () => {
        renderDialog();
        expect(screen.getByText(HINT_TOKEN_COPY.confirm.body(3))).toBeInTheDocument();
        expect(screen.getByText(HINT_TOKEN_COPY.confirm.earnMore)).toBeInTheDocument();
    });
});
