/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme } from "../../src/client/theme/theme";
import { PlacementProgressBar } from "../../src/client/components/PlacementProgressBar";
import type { PieceId } from "../../src/common/pieceData";

const barElement = (order: PieceId[]) =>
    React.createElement(ThemeProvider, { theme: lightTheme }, React.createElement(PlacementProgressBar, { order }));

const renderBar = (order: PieceId[]) => render(barElement(order));

const segmentDelays = (container: HTMLElement) =>
    Object.fromEntries(
        Array.from(container.querySelectorAll<HTMLElement>("[data-segment-piece-id]"))
            .map(el => [el.getAttribute("data-segment-piece-id"), el.style.getPropertyValue("--segment-delay")])
    );

const segmentIds = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("[data-segment-piece-id]"))
        .map(el => Number(el.getAttribute("data-segment-piece-id")));

describe("PlacementProgressBar", () => {
    it("renders no segments and 0/8 when the board is empty", () => {
        const { container } = renderBar([]);
        const bar = screen.getByRole("progressbar", { name: "Puzzle completion progress" });
        expect(segmentIds(container)).toEqual([]);
        expect(bar.getAttribute("aria-valuenow")).toBe("0");
        expect(bar.getAttribute("aria-valuetext")).toBe("0 of 8 pieces placed");
        expect(bar.textContent).toBe("0/8");
    });

    it("renders one segment per placed piece, in placement order", () => {
        const { container } = renderBar([6, 2, 8]);
        expect(segmentIds(container)).toEqual([6, 2, 8]);
    });

    it("reports 12.5% per piece", () => {
        renderBar([6, 2, 8]);
        const bar = screen.getByRole("progressbar");
        expect(bar.getAttribute("aria-valuenow")).toBe("37.5");
        expect(bar.getAttribute("aria-valuetext")).toBe("3 of 8 pieces placed");
    });

    it("reports 100 when all eight pieces are placed", () => {
        renderBar([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
    });

    it("is not text-selectable, so a click cannot drop a caret into a segment", () => {
        renderBar([6, 2, 8]);
        const bar = screen.getByRole("progressbar");
        expect(window.getComputedStyle(bar).getPropertyValue("user-select")).toBe("none");
    });

    describe("grow-in sequencing", () => {
        it("staggers segments that appear together, left to right", () => {
            const { container } = renderBar([6, 2, 8]);
            expect(segmentDelays(container)).toEqual({ 6: "0ms", 2: "150ms", 8: "300ms" });
        });

        it("starts a single newly placed piece at once and keeps the others' delays", () => {
            const { container, rerender } = renderBar([6, 2, 8]);
            rerender(barElement([6, 2, 8, 1]));
            expect(segmentDelays(container)).toEqual({ 6: "0ms", 2: "150ms", 8: "300ms", 1: "0ms" });
        });

        it("starts a piece at once when it comes back after a removal", () => {
            const { container, rerender } = renderBar([6, 2, 8]);
            rerender(barElement([6, 8]));
            rerender(barElement([6, 8, 2]));
            expect(segmentDelays(container)).toEqual({ 6: "0ms", 8: "300ms", 2: "0ms" });
        });
    });
});
