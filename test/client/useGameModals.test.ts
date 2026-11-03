/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useGameModals } from "../../src/client/layouts/common/useGameModals";
import type { UserSettings } from "../../src/common/restTypes";
import { DAYS_IN_MONTH } from "../../src/common/consts";

const user = { id: "u1", isAdmin: false };

const renderModals = (settings: UserSettings, options: { completedDates?: { month: number; day: number }[] } = {}) => {
    const onTokenIntroSeen = jest.fn();
    const hook = renderHook(() => useGameModals({
        user,
        userLoading: false,
        completedDates: options.completedDates ?? [],
        currentDate: { month: 5, day: 10 },
        settings,
        onTokenIntroSeen
    }));
    return { ...hook, onTokenIntroSeen };
};

describe("useGameModals token intro", () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2024, 5, 10, 12) });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("opens once for a user who has not seen it", () => {
        const { result } = renderModals({});
        expect(result.current.modals.tokenIntro.isOpen).toBe(true);
    });

    it("stays closed once seen", () => {
        const { result } = renderModals({ tokenIntroSeen: true });
        expect(result.current.modals.tokenIntro.isOpen).toBe(false);
    });

    it("marks the view as the first one until the intro was seen", () => {
        expect(renderModals({}).result.current.modals.tokenIntro.isFirstView).toBe(true);
        expect(renderModals({ tokenIntroSeen: true }).result.current.modals.tokenIntro.isFirstView).toBe(false);
    });

    it("waits while another dialog is open, then shows", () => {
        const { result } = renderModals({});
        act(() => result.current.modals.stats.open());
        expect(result.current.modals.tokenIntro.isOpen).toBe(false);

        act(() => result.current.modals.stats.close());
        expect(result.current.modals.tokenIntro.isOpen).toBe(true);
    });

    it("shows before the solved-today notice, which waits for it to close", () => {
        // Today (Jun 10) is solved, so the notice is requested on load
        const { result } = renderModals({}, { completedDates: [{ month: 5, day: 10 }] });
        expect(result.current.modals.tokenIntro.isOpen).toBe(true);
        expect(result.current.modals.solvedNotice.isOpen).toBe(false);

        act(() => result.current.modals.tokenIntro.close());
        expect(result.current.modals.solvedNotice.isOpen).toBe(true);
    });

    it("closing marks it seen, once", () => {
        const { result, onTokenIntroSeen } = renderModals({});
        act(() => result.current.modals.tokenIntro.close());

        expect(result.current.modals.tokenIntro.isOpen).toBe(false);
        expect(onTokenIntroSeen).toHaveBeenCalledTimes(1);
    });

    it("can be reopened from the menu after it was seen", () => {
        const { result } = renderModals({ tokenIntroSeen: true });
        act(() => result.current.modals.tokenIntro.open());
        expect(result.current.modals.tokenIntro.isOpen).toBe(true);
    });
});

describe("useGameModals after a solve", () => {
    const JUN_10 = { month: 5, day: 10 };
    const JUN_9 = { month: 5, day: 9 };
    const settings = { tokenIntroSeen: true };

    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2024, 5, 10, 12) });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const renderFlow = (completedDates: { month: number; day: number }[] = []) => renderHook(
        (props: { completedDates: { month: number; day: number }[]; currentDate: { month: number; day: number } }) => useGameModals({
            user, userLoading: false, settings, onTokenIntroSeen: jest.fn(), ...props
        }),
        { initialProps: { completedDates, currentDate: JUN_10 } }
    );

    it("opens stats with the solved date and the next one", () => {
        const { result } = renderFlow();
        act(() => {
            result.current.noteSolve(JUN_10);
            result.current.openStatsAfterSolve();
        });
        expect(result.current.modals.stats.isOpen).toBe(true);
        expect(result.current.modals.stats.solveResult).toEqual({ solvedDate: JUN_10, nextDate: JUN_9 });
    });

    it("keeps the solved date when the date changes before stats opens", () => {
        const { result, rerender } = renderFlow();
        act(() => result.current.noteSolve(JUN_10));
        rerender({ completedDates: [], currentDate: JUN_9 });
        act(() => result.current.openStatsAfterSolve());
        expect(result.current.modals.stats.solveResult?.solvedDate).toEqual(JUN_10);
    });

    it("keeps the result while the dialog fades out, and clears it for a toolbar open", () => {
        const { result } = renderFlow();
        act(() => {
            result.current.noteSolve(JUN_10);
            result.current.openStatsAfterSolve();
        });
        act(() => result.current.modals.stats.close());
        expect(result.current.modals.stats.solveResult).not.toBeNull();

        act(() => result.current.modals.stats.open());
        expect(result.current.modals.stats.solveResult).toBeNull();
    });

    it("doesn't offer another dialog when stats closes", () => {
        const { result } = renderFlow();
        act(() => {
            result.current.noteSolve(JUN_10);
            result.current.openStatsAfterSolve();
        });
        act(() => result.current.modals.stats.close());
        expect(result.current.modals.stats.isOpen).toBe(false);
        expect(result.current.modals.solvedNotice.isOpen).toBe(false);
        expect(result.current.modals.yearComplete.isOpen).toBe(false);
    });

    it("opens Year Complete when stats closes after the last date", () => {
        const allButToday = allDatesExcept(JUN_10);
        const { result } = renderFlow(allButToday);
        act(() => {
            result.current.noteSolve(JUN_10);
            result.current.openStatsAfterSolve();
        });
        expect(result.current.modals.stats.solveResult?.nextDate).toBeNull();

        act(() => result.current.modals.stats.close());
        expect(result.current.modals.yearComplete.isOpen).toBe(true);
    });

    it("doesn't say 'already solved' when today is solved during the session", () => {
        const { result, rerender } = renderFlow();
        act(() => result.current.noteSolve(JUN_10));
        rerender({ completedDates: [JUN_10], currentDate: JUN_10 });
        expect(result.current.modals.solvedNotice.isOpen).toBe(false);
    });

    it("shows the notice with the next date when today was solved earlier", () => {
        const { result } = renderFlow([JUN_10]);
        expect(result.current.modals.solvedNotice.isOpen).toBe(true);
        expect(result.current.modals.solvedNotice.nextDate).toEqual(JUN_9);
        expect(result.current.modals.stats.isOpen).toBe(false);
    });

    it("opens Year Complete on load, without the notice, when every date is solved", () => {
        const { result } = renderFlow([...allDatesExcept(JUN_10), JUN_10]);
        expect(result.current.modals.yearComplete.isOpen).toBe(true);
        expect(result.current.modals.solvedNotice.isOpen).toBe(false);
    });

    it("hides the notice while a dialog is open, and brings it back after", () => {
        const { result } = renderFlow([JUN_10]);
        act(() => result.current.modals.help.open());
        expect(result.current.modals.solvedNotice.isOpen).toBe(false);

        act(() => result.current.modals.help.close());
        expect(result.current.modals.solvedNotice.isOpen).toBe(true);
    });

    it("closes the notice for good when the date changes, not when the date object is copied", () => {
        const { result, rerender } = renderFlow([JUN_10]);
        rerender({ completedDates: [JUN_10], currentDate: { ...JUN_10 } });
        expect(result.current.modals.solvedNotice.isOpen).toBe(true);

        rerender({ completedDates: [JUN_10], currentDate: JUN_9 });
        expect(result.current.modals.solvedNotice.isOpen).toBe(false);

        rerender({ completedDates: [JUN_10], currentDate: JUN_10 });
        expect(result.current.modals.solvedNotice.isOpen).toBe(false);
    });

    it("closes the notice when a new solve starts", () => {
        const { result } = renderFlow([JUN_10]);
        act(() => result.current.noteSolve(JUN_9));
        expect(result.current.modals.solvedNotice.isOpen).toBe(false);
    });
});

/** Every calendar date (a leap year, as the game has 366) except the given one. */
function allDatesExcept(excluded: { month: number; day: number }) {
    const dates: { month: number; day: number }[] = [];
    for (let month = 0; month < 12; month++) {
        for (let day = 1; day <= DAYS_IN_MONTH[month]; day++) {
            if (month !== excluded.month || day !== excluded.day) {
                dates.push({ month, day });
            }
        }
    }
    return dates;
}
