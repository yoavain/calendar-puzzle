import {
    BADGE_SMALL_FORM_MAX_SIZE,
    BADGE_VIEWBOX,
    buildBadgePalette,
    buildBadgeShapes
} from "../../../src/client/utils/badgeGeometry";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../../../src/common/consts";

/** Cells the real board never exposes: two month-row tails and the last-row tail. */
const HIDDEN_CELL_COUNT = 6;

/** The two uncovered date cells. */
const LIT_CELL_COUNT = 2;

describe("badgeGeometry", () => {
    describe("buildBadgeShapes — full board", () => {
        const shapes = buildBadgeShapes(BADGE_SMALL_FORM_MAX_SIZE);

        it("should draw every board cell except the ones the board never exposes", () => {
            expect(shapes).toHaveLength(BOARD_WIDTH * BOARD_HEIGHT - HIDDEN_CELL_COUNT);
        });

        it("should leave exactly the two date cells lit", () => {
            expect(shapes.filter(s => s.tone === "lit")).toHaveLength(LIT_CELL_COUNT);
        });

        it("should keep every cell inside the coin face", () => {
            const centre = BADGE_VIEWBOX / 2;
            const radius = BADGE_VIEWBOX / 2 - 1;
            for (const s of shapes) {
                const corners = [
                    [s.x, s.y],
                    [s.x + s.width, s.y],
                    [s.x, s.y + s.height],
                    [s.x + s.width, s.y + s.height]
                ];
                for (const [x, y] of corners) {
                    expect(Math.hypot(x - centre, y - centre)).toBeLessThanOrEqual(radius);
                }
            }
        });

        it("should use uniform square cells", () => {
            const [first] = shapes;
            for (const s of shapes) {
                expect(s.width).toBeCloseTo(first.width, 5);
                expect(s.height).toBeCloseTo(first.width, 5);
            }
        });
    });

    describe("buildBadgeShapes — simplified form", () => {
        const shapes = buildBadgeShapes(BADGE_SMALL_FORM_MAX_SIZE - 1);

        it("should collapse the grid to three silhouette blocks plus the date cells", () => {
            expect(shapes).toHaveLength(3 + LIT_CELL_COUNT);
            expect(shapes.filter(s => s.tone === "engraved")).toHaveLength(3);
            expect(shapes.filter(s => s.tone === "lit")).toHaveLength(LIT_CELL_COUNT);
        });

        it("should step the silhouette six wide, then seven, then three", () => {
            const [months, days, lastRow] = shapes.filter(s => s.tone === "engraved");
            const unit = days.width / BOARD_WIDTH;
            expect(months.width / unit).toBeCloseTo(6, 5);
            expect(days.width / unit).toBeCloseTo(7, 5);
            expect(lastRow.width / unit).toBeCloseTo(3, 5);
        });

        it("should butt the blocks together with no gap between them", () => {
            const [months, days, lastRow] = shapes.filter(s => s.tone === "engraved");
            // Each block bleeds slightly into the next so antialiasing leaves no seam.
            expect(months.y + months.height).toBeGreaterThanOrEqual(days.y);
            expect(days.y + days.height).toBeGreaterThanOrEqual(lastRow.y);
        });

        it("should square the corners so the steps stay crisp", () => {
            for (const s of shapes.filter(x => x.tone === "engraved")) {
                expect(s.radius).toBe(0);
            }
        });

        it("should keep the date cells on top of the silhouette", () => {
            const engraved = shapes.filter(s => s.tone === "engraved");
            const left = Math.min(...engraved.map(s => s.x));
            const right = Math.max(...engraved.map(s => s.x + s.width));
            const top = Math.min(...engraved.map(s => s.y));
            const bottom = Math.max(...engraved.map(s => s.y + s.height));
            for (const lit of shapes.filter(s => s.tone === "lit")) {
                expect(lit.x).toBeGreaterThanOrEqual(left);
                expect(lit.x + lit.width).toBeLessThanOrEqual(right);
                expect(lit.y).toBeGreaterThanOrEqual(top);
                expect(lit.y + lit.height).toBeLessThanOrEqual(bottom);
            }
        });
    });

    describe("form selection", () => {
        it("should switch forms at the documented threshold", () => {
            expect(buildBadgeShapes(BADGE_SMALL_FORM_MAX_SIZE)).toHaveLength(
                BOARD_WIDTH * BOARD_HEIGHT - HIDDEN_CELL_COUNT
            );
            expect(buildBadgeShapes(BADGE_SMALL_FORM_MAX_SIZE - 1)).toHaveLength(3 + LIT_CELL_COUNT);
        });

        it("should use the full board at every size the badge ships at above the threshold", () => {
            for (const size of [32, 76, 92]) {
                expect(buildBadgeShapes(size).length).toBeGreaterThan(3 + LIT_CELL_COUNT);
            }
        });
    });

    describe("buildBadgePalette", () => {
        const palette = buildBadgePalette("#FFD700");

        it("should derive five distinct tones from the single gold token", () => {
            const tones = Object.values(palette);
            expect(tones).toHaveLength(5);
            expect(new Set(tones).size).toBe(5);
        });

        it("should keep the supplied gold as the face mid-tone", () => {
            expect(palette.faceMid).toBe("#FFD700");
        });

        it("should order the coin face light to deep, with lit above and engraved below", () => {
            const luminance = (hex: string) => {
                const [r, g, b] = hex.startsWith("#")
                    ? [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
                    : (hex.match(/\d+/g) ?? []).map(Number);
                return 0.299 * r + 0.587 * g + 0.114 * b;
            };
            expect(luminance(palette.faceLight)).toBeGreaterThan(luminance(palette.faceMid));
            expect(luminance(palette.faceMid)).toBeGreaterThan(luminance(palette.faceDeep));
            expect(luminance(palette.lit)).toBeGreaterThan(luminance(palette.faceLight));
            expect(luminance(palette.engraved)).toBeLessThan(luminance(palette.faceDeep));
        });
    });
});
