/**
 * @jest-environment jsdom
 */
import {
    canShareImage,
    computeYearImageLayout,
    renderYearImage,
    saveYearImage,
    shareYearImage
} from "../../../src/client/utils/yearImage";
import { buildBadgeShapes } from "../../../src/client/utils/badgeGeometry";
import { DAYS_IN_MONTH, MONTHS, SHARE_URL, TOTAL_DATES } from "../../../src/common/consts";

const FILE_NAME = "calendar-puzzle-366.png";
const OBJECT_URL = "blob:http://localhost/year-image";

interface DrawCall {
    op: string;
    args: unknown[];
}

/**
 * A stand-in for a 2D context that records the calls made against it. jsdom has
 * no canvas and the project deliberately avoids pulling in `jest-canvas-mock`
 * for this, so the drawing is verified by inspecting the call log instead.
 */
function createRecordingCanvas(options: { roundRect?: boolean; context?: boolean } = {}) {
    const { roundRect = true, context = true } = options;
    const calls: DrawCall[] = [];
    const record = (op: string) => (...args: unknown[]) => {
        calls.push({ op, args });
    };

    const ctx: Record<string, unknown> = {
        save: record("save"),
        restore: record("restore"),
        translate: record("translate"),
        scale: record("scale"),
        beginPath: record("beginPath"),
        rect: record("rect"),
        arc: record("arc"),
        fill: record("fill"),
        fillRect: record("fillRect"),
        fillText: record("fillText"),
        createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() }))
    };
    if (roundRect) {
        ctx["roundRect"] = record("roundRect");
    }
    // Assignments are part of the drawing instructions, so record them too.
    for (const prop of ["fillStyle", "font", "textAlign", "textBaseline"]) {
        Object.defineProperty(ctx, prop, {
            get: () => "",
            set: (value: unknown) => {
                calls.push({ op: prop, args: [value] });
            }
        });
    }

    let blob: Blob | null = new Blob(["png"], { type: "image/png" });
    const canvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => (context ? ctx : null)),
        toBlob: jest.fn((cb: (b: Blob | null) => void) => cb(blob))
    };

    return {
        canvas: canvas as unknown as HTMLCanvasElement,
        calls,
        setBlob: (b: Blob | null) => {
            blob = b;
        },
        /** Calls made between the badge's save/restore pair. */
        badgeCalls: () => {
            const start = calls.findIndex(c => c.op === "save");
            const end = calls.findIndex(c => c.op === "restore");
            return calls.slice(start, end);
        },
        /** Calls made before the badge is drawn (background + mosaic). */
        mosaicCalls: () => calls.slice(0, calls.findIndex(c => c.op === "save")),
        /** Calls made after the badge is drawn (the text block). */
        textCalls: () => calls.slice(calls.findIndex(c => c.op === "restore"))
    };
}

/** Swaps in a fake navigator for one test, restoring the real one after. */
function stubNavigator(props: Record<string, unknown>) {
    const original = Object.getOwnPropertyDescriptor(window, "navigator");
    Object.defineProperty(window, "navigator", { value: props, configurable: true });
    return () => {
        if (original) {
            Object.defineProperty(window, "navigator", original);
        }
    };
}

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

    describe("renderYearImage", () => {
        it("should throw when no 2D context is available", () => {
            const { canvas } = createRecordingCanvas({ context: false });
            expect(() => renderYearImage(canvas, "#FFD700")).toThrow("Canvas 2D context unavailable");
        });

        it("should size the backing store at 2x the logical card for a crisp export", () => {
            const { canvas } = createRecordingCanvas();
            const layout = computeYearImageLayout();
            renderYearImage(canvas, "#FFD700");
            expect(canvas.width).toBe(layout.width * 2);
            expect(canvas.height).toBe(layout.height * 2);
        });

        it("should draw one cell per calendar date", () => {
            const recorder = createRecordingCanvas();
            renderYearImage(recorder.canvas, "#FFD700");
            const cells = recorder.mosaicCalls().filter(c => c.op === "roundRect");
            expect(cells).toHaveLength(TOTAL_DATES);
        });

        it("should draw every month label", () => {
            const recorder = createRecordingCanvas();
            renderYearImage(recorder.canvas, "#FFD700");
            const labels = recorder.mosaicCalls()
                .filter(c => c.op === "fillText")
                .map(c => c.args[0]);
            expect(labels).toEqual(MONTHS.map(m => m.toUpperCase()));
        });

        it("should draw the badge scaled inside a save/restore pair", () => {
            const recorder = createRecordingCanvas();
            const layout = computeYearImageLayout();
            renderYearImage(recorder.canvas, "#FFD700");
            const badge = recorder.badgeCalls();

            expect(badge.find(c => c.op === "translate")?.args).toEqual([layout.badgeX, layout.badgeY]);
            expect(badge.some(c => c.op === "scale")).toBe(true);
            // The coin, then one rect per struck cell.
            expect(badge.filter(c => c.op === "arc")).toHaveLength(1);
            expect(badge.filter(c => c.op === "roundRect"))
                .toHaveLength(buildBadgeShapes(layout.badgeSize).length);
        });

        it("should caption the card with the count, the title and the full URL", () => {
            const recorder = createRecordingCanvas();
            renderYearImage(recorder.canvas, "#FFD700");
            const texts = recorder.textCalls()
                .filter(c => c.op === "fillText")
                .map(c => c.args[0]);

            expect(texts).toEqual([
                `${TOTAL_DATES} / ${TOTAL_DATES}`,
                "Every date on the calendar",
                SHARE_URL.toUpperCase()
            ]);
            // The protocol is what makes the footer read as a URL.
            expect(texts[2]).toContain("HTTPS://");
        });

        it("should paint the count in the supplied gold", () => {
            const recorder = createRecordingCanvas();
            renderYearImage(recorder.canvas, "#ABCDEF");
            const fills = recorder.textCalls().filter(c => c.op === "fillStyle").map(c => c.args[0]);
            expect(fills[0]).toBe("#ABCDEF");
        });

        it("should fall back to square corners when roundRect is unsupported", () => {
            const recorder = createRecordingCanvas({ roundRect: false });
            renderYearImage(recorder.canvas, "#FFD700");
            expect(recorder.calls.some(c => c.op === "roundRect")).toBe(false);
            expect(recorder.mosaicCalls().filter(c => c.op === "rect")).toHaveLength(TOTAL_DATES);
        });
    });

    describe("saveYearImage", () => {
        let created: HTMLAnchorElement[];
        let restore: () => void;

        beforeEach(() => {
            created = [];
            const realCreate = document.createElement.bind(document);
            jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
                const el = realCreate(tag);
                if (tag === "a") {
                    created.push(el as HTMLAnchorElement);
                }
                return el;
            });
            jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
            URL.createObjectURL = jest.fn(() => OBJECT_URL);
            URL.revokeObjectURL = jest.fn();
            restore = () => jest.restoreAllMocks();
        });

        afterEach(() => restore());

        it("should download the PNG under a descriptive filename", async () => {
            const { canvas } = createRecordingCanvas();
            await saveYearImage(canvas);

            expect(created).toHaveLength(1);
            expect(created[0].download).toBe(FILE_NAME);
            expect(created[0].href).toBe(OBJECT_URL);
            expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
        });

        it("should release the object URL after clicking", async () => {
            const { canvas } = createRecordingCanvas();
            await saveYearImage(canvas);
            expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
        });

        it("should reject when the canvas cannot be encoded", async () => {
            const recorder = createRecordingCanvas();
            recorder.setBlob(null);
            await expect(saveYearImage(recorder.canvas)).rejects.toThrow("Failed to encode image");
        });
    });

    describe("canShareImage", () => {
        let restore = () => {};
        afterEach(() => restore());

        it("should be false when the browser has no share API", () => {
            restore = stubNavigator({});
            expect(canShareImage()).toBe(false);
        });

        it("should be false when sharing exists but rejects files", () => {
            restore = stubNavigator({ share: jest.fn(), canShare: () => false });
            expect(canShareImage()).toBe(false);
        });

        it("should be true when the browser accepts a PNG file", () => {
            restore = stubNavigator({ share: jest.fn(), canShare: () => true });
            expect(canShareImage()).toBe(true);
        });

        it("should treat a throwing canShare as unsupported", () => {
            restore = stubNavigator({
                share: jest.fn(),
                canShare: () => {
                    throw new Error("nope");
                }
            });
            expect(canShareImage()).toBe(false);
        });
    });

    describe("shareYearImage", () => {
        let restoreNav = () => {};
        const realClipboardItem = globalThis.ClipboardItem;

        afterEach(() => {
            restoreNav();
            globalThis.ClipboardItem = realClipboardItem;
            jest.restoreAllMocks();
        });

        it("should use the native share sheet when one is available", async () => {
            const share = jest.fn(async (_data: ShareData) => {});
            restoreNav = stubNavigator({ share, canShare: () => true });
            const { canvas } = createRecordingCanvas();

            await expect(shareYearImage(canvas)).resolves.toBe("shared");
            const [payload] = share.mock.calls[0];
            expect(payload.title).toBe("Calendar Puzzle");
            expect(payload.files?.[0].name).toBe(FILE_NAME);
            expect(payload.files?.[0].type).toBe("image/png");
        });

        it("should copy to the clipboard when there is no share sheet", async () => {
            const write = jest.fn(async () => {});
            restoreNav = stubNavigator({ clipboard: { write } });
            globalThis.ClipboardItem = jest.fn(function(this: unknown, items: unknown) {
                (this as { items: unknown }).items = items;
            }) as unknown as typeof ClipboardItem;
            const { canvas } = createRecordingCanvas();

            await expect(shareYearImage(canvas)).resolves.toBe("copied");
            expect(write).toHaveBeenCalledTimes(1);
        });

        it("should hand ClipboardItem the blob promise, not an awaited blob", async () => {
            // Safari rejects a ClipboardItem constructed after an await, treating
            // it as outside the user gesture — so this must stay a promise.
            const constructed: Record<string, unknown>[] = [];
            restoreNav = stubNavigator({ clipboard: { write: jest.fn(async () => {}) } });
            globalThis.ClipboardItem = jest.fn(function(items: Record<string, unknown>) {
                constructed.push(items);
            }) as unknown as typeof ClipboardItem;
            const { canvas } = createRecordingCanvas();

            await shareYearImage(canvas);

            expect(constructed).toHaveLength(1);
            expect(typeof (constructed[0]["image/png"] as Promise<Blob>)?.then).toBe("function");
            expect(constructed[0]["image/png"]).not.toBeInstanceOf(Blob);
        });

        it("should fall back to a download when neither API exists", async () => {
            restoreNav = stubNavigator({});
            // @ts-expect-error - removing the global for this test
            delete globalThis.ClipboardItem;
            jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
            URL.createObjectURL = jest.fn(() => OBJECT_URL);
            URL.revokeObjectURL = jest.fn();
            const { canvas } = createRecordingCanvas();

            await expect(shareYearImage(canvas)).resolves.toBe("downloaded");
            expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
        });
    });
});
