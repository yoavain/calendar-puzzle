/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { SolvedTodayNotice } from "../../src/client/components/SolvedTodayNotice";
import { StatsModal } from "../../src/client/components/StatsModal";
import { SOLVE_COPY } from "../../src/client/copy/solveCopy";
import { useUser } from "../../src/client/context/UserContext";
import { lightTheme } from "../../src/client/theme/theme";

jest.mock("../../src/client/context/UserContext", () => ({ useUser: jest.fn() }));

const FEB_20 = { month: 1, day: 20 };
const FEB_19 = { month: 1, day: 19 };

const withTheme = (child: React.ReactElement) => React.createElement(ThemeProvider, { theme: lightTheme }, child);

describe("StatsModal after a solve", () => {
    beforeEach(() => {
        jest.mocked(useUser).mockReturnValue({ completedDates: [], playedDates: [] } as unknown as ReturnType<typeof useUser>);
    });

    const renderStats = (props: Partial<React.ComponentProps<typeof StatsModal>>) => {
        const onClose = jest.fn();
        const onPlayNext = jest.fn();
        render(withTheme(React.createElement(StatsModal, { open: true, onClose, onPlayNext, ...props })));
        return { onClose, onPlayNext };
    };

    it("keeps its title and one button when opened from the toolbar", () => {
        renderStats({ solveResult: null });
        expect(screen.getByRole("heading", { name: "STATISTICS" })).toBeInTheDocument();
        expect(screen.getAllByRole("button")).toHaveLength(1);
    });

    it("names the solved date and offers the next one", () => {
        const { onPlayNext } = renderStats({ solveResult: { solvedDate: FEB_20, nextDate: FEB_19 } });
        expect(screen.getByRole("heading", { name: "Feb 20 solved" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Play Feb 19" }));
        expect(onPlayNext).toHaveBeenCalledWith(FEB_19);
    });

    it("offers nothing when no date is left", () => {
        renderStats({ solveResult: { solvedDate: FEB_20, nextDate: null } });
        expect(screen.getByRole("heading", { name: "Feb 20 solved" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /^Play/ })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });
});

describe("SolvedTodayNotice", () => {
    const renderNotice = (open = true) => {
        const onPlay = jest.fn();
        const onClose = jest.fn();
        render(withTheme(React.createElement(SolvedTodayNotice, { open, nextDate: FEB_19, onPlay, onClose })));
        return { onPlay, onClose };
    };

    afterEach(() => {
        jest.useRealTimers();
    });

    it("offers the next date", () => {
        const { onPlay } = renderNotice();
        expect(screen.getByRole("status")).toHaveTextContent(SOLVE_COPY.solvedTodayNotice);
        fireEvent.click(screen.getByRole("button", { name: "Play Feb 19" }));
        expect(onPlay).toHaveBeenCalledWith(FEB_19);
    });

    it("closes from its button", () => {
        const { onClose } = renderNotice();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes by itself after 8 seconds", () => {
        jest.useFakeTimers();
        const { onClose } = renderNotice();
        act(() => {
            jest.advanceTimersByTime(7999);
        });
        expect(onClose).not.toHaveBeenCalled();
        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("stays when the player taps elsewhere, as the board stays usable", () => {
        const { onClose } = renderNotice();
        fireEvent.click(document.body);
        expect(onClose).not.toHaveBeenCalled();
    });

    it("sits under the dialogs", () => {
        renderNotice();
        const root = screen.getByRole("status").parentElement as HTMLElement;
        expect(getComputedStyle(root).zIndex).toBe(String(lightTheme.zIndex.modal - 1));
    });

    it("renders nothing while closed", () => {
        renderNotice(false);
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
});
