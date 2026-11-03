/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { DatePicker } from "../../src/client/components/DatePicker";
import { HallOfFameModal } from "../../src/client/components/HallOfFameModal";
import { lightTheme } from "../../src/client/theme/theme";
import { useUser } from "../../src/client/context/UserContext";
import { getUserActivity } from "../../src/client/service/puzzleService";
import { TOTAL_DATES } from "../../src/common/consts";
import type { UserActivity } from "../../src/common/restTypes";

jest.mock("../../src/client/context/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("../../src/client/service/puzzleService", () => ({ getUserActivity: jest.fn() }));
jest.mock("../../src/client/service/logService", () => ({ logToServer: jest.fn() }));

const FEB = 1;

const withTheme = (child: React.ReactElement) => React.createElement(ThemeProvider, { theme: lightTheme }, child);

describe("DatePicker days", () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2024, FEB, 23), advanceTimers: true });
        jest.mocked(useUser).mockReturnValue({
            user: { id: "u" },
            completedDates: [{ month: FEB, day: 15 }, { month: FEB, day: 23 }],
            playedDates: [{ month: FEB, day: 15 }, { month: FEB, day: 20 }, { month: FEB, day: 23 }]
        } as unknown as ReturnType<typeof useUser>);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const openPicker = (day = 20) => {
        const onDateChange = jest.fn();
        render(withTheme(React.createElement(DatePicker, { currentDate: { month: FEB, day }, onDateChange })));
        fireEvent.click(screen.getByRole("button"));
        return { onDateChange, days: within(screen.getByRole("group", { name: "Days in Feb" })) };
    };

    it("names the status of each day, so it isn't told by colour alone", () => {
        const { days } = openPicker();
        expect(days.getByRole("button", { name: "Feb 15, solved" })).toBeInTheDocument();
        expect(days.getByRole("button", { name: "Feb 20, started" })).toBeInTheDocument();
        expect(days.getByRole("button", { name: "Feb 1" })).toBeInTheDocument();
    });

    it("names today and keeps its status", () => {
        const { days } = openPicker();
        expect(days.getByRole("button", { name: "Feb 23, today, solved" })).toBeInTheDocument();
    });

    it("marks today only in today's month", () => {
        const { days } = openPicker();
        fireEvent.click(screen.getByRole("button", { name: "Mar" }));
        const march = within(screen.getByRole("group", { name: "Days in Mar" }));
        expect(march.getByRole("button", { name: "Mar 23" })).toBeInTheDocument();
        expect(days.queryByRole("button", { name: /today/ })).not.toBeInTheDocument();
    });

    it("selects a clicked day and plays it", () => {
        const { days, onDateChange } = openPicker();
        const tile = days.getByRole("button", { name: "Feb 2" });
        expect(tile).toHaveAttribute("aria-pressed", "false");
        fireEvent.click(tile);
        expect(tile).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: "Play this date" }));
        expect(onDateChange).toHaveBeenCalledWith({ month: FEB, day: 2 });
    });

    it("keeps the grid at 35 cells for every month length", () => {
        const { days } = openPicker();
        const felt = screen.getByRole("group", { name: "Days in Feb" });
        expect(days.getAllByRole("button")).toHaveLength(29);
        expect(felt.children).toHaveLength(35);
        fireEvent.click(screen.getByRole("button", { name: "Jan" }));
        expect(screen.getByRole("group", { name: "Days in Jan" }).children).toHaveLength(35);
    });
});

describe("HallOfFameModal rows", () => {
    const player = (userKey: string, daysSolved: number, daysSolvedWithHint: number, isCurrentUser = false): UserActivity => ({
        userKey,
        isCurrentUser,
        daysPlayed: daysSolved + 5,
        daysSolved,
        daysPlayedWithHint: daysSolvedWithHint,
        daysSolvedWithHint
    });

    const renderRows = async (users: UserActivity[]) => {
        jest.mocked(useUser).mockReturnValue({ user: null } as unknown as ReturnType<typeof useUser>);
        jest.mocked(getUserActivity).mockResolvedValue(users);
        render(withTheme(React.createElement(HallOfFameModal, { open: true, onClose: () => {} })));
        return within(await screen.findByRole("list", { name: "Players by days solved" })).getAllByRole("listitem");
    };

    it("ranks by days solved, then by fewer hints, and hides players with none", async () => {
        const rows = await renderRows([
            player("low", 10, 0),
            player("hints", 90, 5),
            player("clean", 90, 1),
            player("none", 0, 0)
        ]);
        expect(rows).toHaveLength(3);
        expect(rows[0]).toHaveTextContent(/^1.*90 days solved95 played$/);
        expect(rows[2]).toHaveTextContent(/^3.*10 days solved15 played$/);
    });

    it("labels only the current player's row", async () => {
        const rows = await renderRows([player("them", 90, 0), player("me", 10, 0, true)]);
        expect(rows[0]).not.toHaveTextContent("You");
        expect(rows[1]).toHaveTextContent("You");
    });

    it("shows the completion badge only for a player who solved every date", async () => {
        const rows = await renderRows([player("all", TOTAL_DATES, 0), player("some", 10, 0)]);
        expect(within(rows[0]).getByRole("img", { name: "Solved every date" })).toBeInTheDocument();
        expect(within(rows[1]).queryByRole("img", { name: "Solved every date" })).not.toBeInTheDocument();
    });

    it("shows the empty message when no player has solved a date", async () => {
        jest.mocked(useUser).mockReturnValue({ user: null } as unknown as ReturnType<typeof useUser>);
        jest.mocked(getUserActivity).mockResolvedValue([player("none", 0, 0)]);
        render(withTheme(React.createElement(HallOfFameModal, { open: true, onClose: () => {} })));
        expect(await screen.findByText("No data available")).toBeInTheDocument();
    });
});
