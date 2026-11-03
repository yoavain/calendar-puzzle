/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { IssueModal } from "../../src/client/components/IssueModal";
import { lightTheme } from "../../src/client/theme/theme";
import { submitIssue } from "../../src/client/service/puzzleService";

jest.mock("../../src/client/service/puzzleService", () => ({ submitIssue: jest.fn() }));
jest.mock("../../src/client/service/logService", () => ({ logToServer: jest.fn() }));

const SUCCESS_TEXT = /has been submitted successfully/;

const modal = (open: boolean, onClose: () => void) =>
    React.createElement(ThemeProvider, { theme: lightTheme }, React.createElement(IssueModal, { open, onClose }));

const renderModal = () => {
    const onClose = jest.fn();
    return { onClose, view: render(modal(true, onClose)) };
};

const typeTitle = () => fireEvent.change(screen.getByRole("textbox", { name: /Title/ }), { target: { value: "A bug" } });
const typeDescription = () => fireEvent.change(screen.getByRole("textbox", { name: /Description/ }), { target: { value: "Details" } });
const backdrop = () => document.querySelector(".MuiBackdrop-root") as Element;
const pressEscape = () => fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
const clickSubmit = () => fireEvent.click(screen.getByRole("button", { name: "Submit" }));

describe("IssueModal closing", () => {
    it("closes on a backdrop tap when nothing is typed", () => {
        const { onClose } = renderModal();
        fireEvent.click(backdrop());
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each([["title", typeTitle], ["description", typeDescription]])("keeps a typed %s on a backdrop tap", (_name, type) => {
        const { onClose } = renderModal();
        type();
        fireEvent.click(backdrop());
        expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on Esc with a typed draft", () => {
        const { onClose } = renderModal();
        typeTitle();
        pressEscape();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on Cancel with a typed draft and clears it", () => {
        const { onClose } = renderModal();
        typeTitle();
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("");
    });

    it("ignores Esc and the backdrop while it sends", () => {
        jest.mocked(submitIssue).mockReturnValue(new Promise(() => {}));
        const { onClose } = renderModal();
        typeTitle();
        clickSubmit();
        pressEscape();
        fireEvent.click(backdrop());
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    });
});

describe("IssueModal submitting", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(submitIssue).mockResolvedValue(true);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const submitSuccessfully = async () => {
        typeTitle();
        clickSubmit();
        await act(async () => {
            await jest.advanceTimersByTimeAsync(0);
        });
    };

    it("replaces the form with the success message and one Close button", async () => {
        renderModal();
        await submitSuccessfully();
        expect(screen.getByText(SUCCESS_TEXT)).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
    });

    it("closes by itself after the delay", async () => {
        const { onClose } = renderModal();
        await submitSuccessfully();
        expect(onClose).not.toHaveBeenCalled();
        act(() => {
            jest.advanceTimersByTime(2000);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on a backdrop tap after success, although the draft text is still in state", async () => {
        const { onClose } = renderModal();
        await submitSuccessfully();
        fireEvent.click(backdrop());
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("doesn't close again after a manual close, so a reopened dialog survives", async () => {
        const { onClose } = renderModal();
        await submitSuccessfully();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(onClose).toHaveBeenCalledTimes(1);
        act(() => {
            jest.advanceTimersByTime(5000);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("keeps the draft and shows an error when the send fails", async () => {
        jest.mocked(submitIssue).mockResolvedValue(false);
        renderModal();
        await submitSuccessfully();
        expect(screen.getByRole("alert")).toHaveTextContent("Failed to submit issue");
        expect(screen.getByRole("textbox", { name: /Title/ })).toHaveValue("A bug");
    });
});
