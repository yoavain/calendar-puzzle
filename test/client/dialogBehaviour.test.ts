/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { HallOfFameModal } from "../../src/client/components/HallOfFameModal";
import { HelpModal } from "../../src/client/components/HelpModal";
import { ShareDialog } from "../../src/client/components/ShareDialog";
import { StatsModal } from "../../src/client/components/StatsModal";
import { TokenConfirmDialog } from "../../src/client/components/TokenConfirmDialog";
import { TokenIntroDialog } from "../../src/client/components/TokenIntroDialog";
import { UserMenu } from "../../src/client/components/UserMenu";
import { HINT_TOKEN_COPY } from "../../src/client/copy/hintTokenCopy";
import { useUser } from "../../src/client/context/UserContext";
import { getUserActivity } from "../../src/client/service/puzzleService";
import { lightTheme } from "../../src/client/theme/theme";

jest.mock("../../src/client/context/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("../../src/client/service/puzzleService", () => ({ getUserActivity: jest.fn() }));
jest.mock("../../src/client/service/logService", () => ({ logToServer: jest.fn() }));
// A Vite-only import, which the test runner cannot resolve.
jest.mock("../../src/client/assets/QR.svg?raw", () => ({ __esModule: true, default: "<svg></svg>" }), { virtual: true });

const withTheme = (child: React.ReactElement) => render(React.createElement(ThemeProvider, { theme: lightTheme }, child));

const mockUser = (overrides: Record<string, unknown> = {}) => jest.mocked(useUser).mockReturnValue({
    user: { id: "u1", isAdmin: false },
    completedDates: [],
    playedDates: [],
    tokenBalance: 2,
    settings: {},
    updateSettings: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn(),
    ...overrides
} as unknown as ReturnType<typeof useUser>);

describe("ShareDialog copying", () => {
    const writeText = jest.fn<Promise<void>, [string]>();

    beforeEach(() => {
        writeText.mockReset();
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderShare = () => withTheme(React.createElement(ShareDialog, { open: true, onClose: () => {} }));
    const clickCopy = async () => {
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));
        });
    };

    it("says nothing until the copy has finished", async () => {
        writeText.mockReturnValue(new Promise(() => {}));
        renderShare();
        await clickCopy();
        expect(screen.getByRole("button", { name: "Copy Link" })).toBeInTheDocument();
        expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it("confirms and announces a finished copy", async () => {
        writeText.mockResolvedValue();
        renderShare();
        await clickCopy();
        expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Link copied.");
    });

    it("reports a refused copy and points to the address", async () => {
        writeText.mockRejectedValue(new Error("denied"));
        renderShare();
        await clickCopy();
        expect(screen.getByRole("button", { name: "Couldn't copy" })).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Select the address");
    });

    it("reports a failure when the browser has no clipboard", async () => {
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
        renderShare();
        await clickCopy();
        expect(screen.getByRole("button", { name: "Couldn't copy" })).toBeInTheDocument();
    });

    it("goes back to the plain label afterwards", async () => {
        jest.useFakeTimers();
        writeText.mockResolvedValue();
        renderShare();
        await clickCopy();
        act(() => {
            jest.advanceTimersByTime(2000);
        });
        expect(screen.getByRole("button", { name: "Copy Link" })).toBeInTheDocument();
    });
});

describe("ShareDialog QR code", () => {
    const openEnlarged = () => {
        withTheme(React.createElement(ShareDialog, { open: true, onClose: () => {} }));
        fireEvent.click(screen.getByRole("button", { name: "Enlarge QR code" }));
        return screen.getByRole("dialog", { name: "Enlarged QR code", hidden: true });
    };

    it("opens the enlarged view from a real button", () => {
        expect(within(openEnlarged()).getByAltText("QR code enlarged")).toBeInTheDocument();
    });

    it("gives the enlarged view a close button that takes focus", () => {
        const enlarged = openEnlarged();
        expect(within(enlarged).getByRole("button", { name: "Close", hidden: true })).toHaveFocus();
    });

    it("closes the enlarged view from its close button", () => {
        const enlarged = openEnlarged();
        fireEvent.click(within(enlarged).getByRole("button", { name: "Close", hidden: true }));
        expect(screen.getByRole("button", { name: "Enlarge QR code", hidden: true })).toBeInTheDocument();
    });
});

describe("HallOfFameModal loading", () => {
    beforeEach(() => {
        mockUser();
        jest.mocked(getUserActivity).mockReset();
    });

    const renderModal = () => withTheme(React.createElement(HallOfFameModal, { open: true, onClose: () => {} }));

    it("says so when the load fails, instead of claiming there's no data", async () => {
        jest.mocked(getUserActivity).mockRejectedValue(new Error("offline"));
        renderModal();
        expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load the Hall of Fame.");
        expect(screen.queryByText("No data available")).not.toBeInTheDocument();
    });

    it("retries, and shows the rows when that works", async () => {
        jest.mocked(getUserActivity).mockRejectedValueOnce(new Error("offline"));
        renderModal();
        await screen.findByRole("alert");

        jest.mocked(getUserActivity).mockResolvedValue([
            { userKey: "a", isCurrentUser: false, daysPlayed: 3, daysSolved: 2, daysPlayedWithHint: 0, daysSolvedWithHint: 0 }
        ]);
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(await screen.findByRole("list", { name: "Players by days solved" })).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("keeps the empty message for a real empty list", async () => {
        jest.mocked(getUserActivity).mockResolvedValue([]);
        renderModal();
        expect(await screen.findByText("No data available")).toBeInTheDocument();
    });
});

describe("UserMenu token confirm setting", () => {
    const label = HINT_TOKEN_COPY.menu.askBeforeSpending;

    const openMenu = () => {
        withTheme(React.createElement(UserMenu));
        fireEvent.click(screen.getByRole("button", { name: "Open user menu" }));
    };

    it("offers the way back only after 'Don't ask me again'", () => {
        mockUser({ settings: {} });
        openMenu();
        expect(screen.queryByRole("menuitem", { name: label })).not.toBeInTheDocument();
    });

    it("turns the question back on", () => {
        const updateSettings = jest.fn().mockResolvedValue(undefined);
        mockUser({ settings: { skipTokenConfirm: true }, updateSettings });
        openMenu();
        fireEvent.click(screen.getByRole("menuitem", { name: label }));
        expect(updateSettings).toHaveBeenCalledWith({ skipTokenConfirm: false });
    });
});

describe("Dialog semantics", () => {
    beforeEach(() => {
        mockUser();
    });

    it("describes the token confirm with its message", () => {
        withTheme(React.createElement(TokenConfirmDialog, { open: true, tokenBalance: 3, onConfirm: () => {}, onCancel: () => {} }));
        expect(screen.getByRole("dialog")).toHaveAccessibleDescription(expect.stringContaining(HINT_TOKEN_COPY.confirm.body(3)));
    });

    it("describes the token intro with its steps", () => {
        withTheme(React.createElement(TokenIntroDialog, { open: true, tokenBalance: 0, solvedCount: 0, isFirstView: true, onClose: () => {} }));
        expect(screen.getByRole("dialog")).toHaveAccessibleDescription(expect.stringContaining(HINT_TOKEN_COPY.intro.firstHintFree));
    });

    it("describes Help with the goal", () => {
        withTheme(React.createElement(HelpModal, { open: true, onClose: () => {} }));
        expect(screen.getByRole("dialog")).toHaveAccessibleDescription(expect.stringContaining("The goal is to cover"));
    });

    it("doesn't announce the Stats numbers as headings", () => {
        withTheme(React.createElement(StatsModal, { open: true, onClose: () => {} }));
        expect(screen.queryByRole("heading", { level: 4 })).not.toBeInTheDocument();
    });
});
