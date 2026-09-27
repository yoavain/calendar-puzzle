/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useGameModals } from "../../src/client/layouts/common/useGameModals";
import type { UserSettings } from "../../src/common/restTypes";

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

    it("does not stack on the post-login play-another dialog", () => {
        // Today (Jun 10) is solved, so the play-another flow opens on load
        const { result } = renderModals({}, { completedDates: [{ month: 5, day: 10 }] });
        expect(result.current.modals.playAnother.isOpen || result.current.modals.yearComplete.isOpen).toBe(true);
        expect(result.current.modals.tokenIntro.isOpen).toBe(false);
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

describe("useGameModals play-another after a solve", () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2024, 5, 10, 12) });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("suggests the next puzzle only when the stats dialog closes, not when the date object changes", () => {
        const settings = { tokenIntroSeen: true };
        const onTokenIntroSeen = jest.fn();
        const { result, rerender } = renderHook(
            ({ currentDate }) => useGameModals({ user, userLoading: false, completedDates: [], currentDate, settings, onTokenIntroSeen }),
            { initialProps: { currentDate: { month: 5, day: 10 } } }
        );

        // A solve marks the flag, and the game history hands over a copied date object
        result.current.justSolvedRef.current = true;
        rerender({ currentDate: { month: 5, day: 10 } });
        expect(result.current.modals.playAnother.isOpen).toBe(false);

        act(() => result.current.modals.stats.open());
        act(() => result.current.modals.stats.close());
        expect(result.current.modals.playAnother.isOpen).toBe(true);
    });
});
