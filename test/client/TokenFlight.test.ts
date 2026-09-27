/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { TokenFlight } from "../../src/client/components/TokenFlight";
import { lightTheme } from "../../src/client/theme/theme";

const setReducedMotion = (reduce: boolean) => {
    window.matchMedia = ((query: string) => ({
        matches: reduce && query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })) as unknown as typeof window.matchMedia;
};

const renderFlight = (pending: number, notBefore = 0) => {
    const onLanded = jest.fn();
    render(React.createElement(ThemeProvider, { theme: lightTheme }, React.createElement(TokenFlight, { pending, notBefore, onLanded })));
    return onLanded;
};

describe("TokenFlight", () => {
    beforeEach(() => {
        document.body.replaceChildren();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("lands at once with reduced motion", () => {
        setReducedMotion(true);
        expect(renderFlight(1)).toHaveBeenCalledTimes(1);
    });

    it("lands at once when there is no visible target", () => {
        setReducedMotion(false);
        expect(renderFlight(1)).toHaveBeenCalledTimes(1);
    });

    it("does nothing with nothing pending", () => {
        setReducedMotion(false);
        expect(renderFlight(0)).not.toHaveBeenCalled();
    });

    it("waits until notBefore", () => {
        jest.useFakeTimers({ now: 10_000 });
        setReducedMotion(true);
        const onLanded = renderFlight(1, 10_800);
        expect(onLanded).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(800);
        });
        expect(onLanded).toHaveBeenCalledTimes(1);
    });
});
