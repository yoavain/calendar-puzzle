import { computeYearImageLayout } from "../../../src/client/utils/yearImage";
import { DAYS_IN_MONTH, MONTHS } from "../../../src/common/consts";

describe("yearImage", () => {
    describe("computeYearImageLayout", () => {
        const layout = computeYearImageLayout();

        it("should end the 31 day columns exactly on the card's right padding", () => {
            const columns = Math.max(...DAYS_IN_MONTH);
            const gridRight = layout.gridLeft + columns * layout.cell + (columns - 1) * layout.gap;
            expect(gridRight).toBeCloseTo(layout.width - layout.padding, 5);
        });

        it("should size the grid height from the same cell and gap as the columns", () => {
            const rows = MONTHS.length;
            expect(layout.gridHeight).toBeCloseTo(rows * layout.cell + (rows - 1) * layout.gap, 5);
        });

        it("should stack badge, count, title and url below the grid without overlap", () => {
            const gridBottom = layout.gridTop + layout.gridHeight;
            expect(layout.badgeY).toBeGreaterThan(gridBottom);
            expect(layout.countBaseline).toBeGreaterThan(layout.badgeY + layout.badgeSize);
            expect(layout.titleBaseline).toBeGreaterThan(layout.countBaseline);
            expect(layout.dividerY).toBeGreaterThan(layout.titleBaseline);
            expect(layout.urlBaseline).toBeGreaterThan(layout.dividerY);
            expect(layout.urlBaseline).toBeLessThan(layout.height);
        });

        it("should centre the badge horizontally", () => {
            expect(layout.badgeX + layout.badgeSize / 2).toBeCloseTo(layout.width / 2, 5);
        });

        it("should leave room for month labels left of the grid", () => {
            expect(layout.labelRight).toBeLessThan(layout.gridLeft);
            expect(layout.labelRight).toBeGreaterThan(0);
        });
    });
});
