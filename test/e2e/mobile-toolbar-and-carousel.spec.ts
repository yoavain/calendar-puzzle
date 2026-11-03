import { test, expect, type Page } from "@playwright/test";
import { GamePage, type LayoutKind } from "./fixtures/gamePage";
import { dragPieceToBoard } from "./helpers/dragHelpers";
import { layoutFromProject, mockDate, mockApiRoutes, clearStorage } from "./helpers/testUtils";

/** Piece 4 (violet S-shape) - 5 filled cells. Matches drag-drop.spec.ts. */
const PIECE_ID = 4;
const PIECE_CAROUSEL_INDEX = 3;
const PIECE_CELL_COUNT = 5;

const TOOLBAR_BUTTONS = ["Undo", "Redo", "Reset", "Open menu"];

test.describe("Mobile toolbar and carousel controls", () => {
    let game: GamePage;
    let layout: LayoutKind;

    test.beforeEach(async ({ page }, testInfo) => {
        layout = layoutFromProject(testInfo.project.name);
        await mockApiRoutes(page);
        await clearStorage(page);
        await mockDate(page, new Date(2024, 0, 1));
        game = new GamePage(page, layout);
    });

    const expectOneSetOfControls = async (page: Page) => {
        await expect(page.getByRole("button", { name: "Rotate clockwise" })).toHaveCount(1);
        await expect(page.getByRole("button", { name: "Flip vertical" })).toHaveCount(1);
    };

    const activeDotIndex = (page: Page) => page.locator("[role='tab']").evaluateAll(
        (dots) => dots.findIndex((dot) => dot.getAttribute("aria-selected") === "true")
    );

    /** Swipes along the carousel axis, starting on a neighbour's hidden controls. */
    const swipeToNextPiece = async (page: Page) => {
        const box = await page.locator("[aria-roledescription='carousel']").boundingBox();
        if (!box) {
            throw new Error("The carousel has no bounding box");
        }
        const isVertical = layout === "mobile-landscape";
        // In portrait the neighbour's controls sit at the bottom right of the carousel.
        // In landscape they sit below the active slide.
        const start = isVertical
            ? { x: box.x + box.width / 2, y: box.y + box.height - 8 }
            : { x: box.x + box.width - 8, y: box.y + box.height - 30 };
        const distance = (isVertical ? box.height : box.width) * 0.6;

        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
        for (let i = 1; i <= 10; i++) {
            const offset = (distance * i) / 10;
            const point = isVertical ? { x: start.x, y: start.y - offset } : { x: start.x - offset, y: start.y };
            await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
            await page.waitForTimeout(16);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await cdp.detach();
        await page.waitForTimeout(500);
    };

    test("the desktop toolbar keeps the sun and moon", async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "desktop", "Desktop only");
        await game.goto();
        await expect(page.getByTestId("LightModeIcon")).toBeVisible();
        await expect(page.getByTestId("DarkModeIcon")).toBeVisible();
    });

    test.describe("on a touch layout", () => {
        test.beforeEach(async ({ page: _page }, testInfo) => {
            test.skip(testInfo.project.name === "desktop", "Touch layouts only");
        });

        test("toolbar buttons are 44px, and the sun and moon are gone", async ({ page }) => {
            await game.goto();
            for (const name of TOOLBAR_BUTTONS) {
                const box = await page.getByRole("button", { name, exact: true }).boundingBox();
                expect(box?.width, name).toBeGreaterThanOrEqual(44);
                expect(box?.height, name).toBeGreaterThanOrEqual(44);
            }
            await expect(page.getByTestId("LightModeIcon")).toHaveCount(0);
            await expect(page.getByTestId("DarkModeIcon")).toHaveCount(0);
        });

        test("only the active slide shows controls, after a dot tap and a placement", async ({ page }) => {
            await game.goto();
            await expectOneSetOfControls(page);

            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX);
            await expectOneSetOfControls(page);

            await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
            await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
            await expectOneSetOfControls(page);
        });

        test("a swipe that starts on hidden controls still moves the carousel, and a drag still starts", async ({ page }) => {
            await game.goto();
            await game.scrollCarouselToPiece(PIECE_CAROUSEL_INDEX - 1);
            expect(await activeDotIndex(page)).toBe(PIECE_CAROUSEL_INDEX - 1);

            await swipeToNextPiece(page);
            expect(await activeDotIndex(page)).toBe(PIECE_CAROUSEL_INDEX);
            await expectOneSetOfControls(page);

            await dragPieceToBoard(page, game.carouselPiece(PIECE_ID), game.boardCell(2, 2), layout);
            await expect(game.pieceCellsOnBoard(PIECE_ID)).toHaveCount(PIECE_CELL_COUNT);
        });
    });

    test.describe("the progress bar", () => {
        for (const viewport of [
            { width: 320, height: 568 },
            { width: 360, height: 640 },
            { width: 393, height: 851 },
            { width: 667, height: 375 },
            { width: 844, height: 390 }
        ]) {
            test.describe(`at ${viewport.width} x ${viewport.height}`, () => {
                test.use({ viewport });

                test("fits inside the window, with its label centred", async ({ page }, testInfo) => {
                    test.skip(testInfo.project.name !== "mobile-portrait", "The size under test comes from the viewport, not the project");
                    await game.goto();

                    const bar = page.getByRole("progressbar", { name: "Puzzle completion progress" });
                    const measured = await bar.evaluate((track) => {
                        const rect = track.getBoundingClientRect();

                        // A clipping parent can cut the bar off well inside the window.
                        let clipLeft = 0;
                        let clipRight = window.innerWidth;
                        for (let el = track.parentElement; el; el = el.parentElement) {
                            if (getComputedStyle(el).overflowX !== "visible") {
                                const parent = el.getBoundingClientRect();
                                clipLeft = Math.max(clipLeft, parent.left);
                                clipRight = Math.min(clipRight, parent.right);
                            }
                        }

                        // Measure the label's text, because its box fills the whole bar.
                        const range = document.createRange();
                        range.selectNodeContents(track.querySelector("[aria-hidden='true']") as Node);
                        const text = range.getBoundingClientRect();
                        return {
                            left: rect.left,
                            right: rect.right,
                            clipLeft,
                            clipRight,
                            textCentre: text.left + text.width / 2,
                            visibleCentre: (Math.max(rect.left, clipLeft) + Math.min(rect.right, clipRight)) / 2
                        };
                    });
                    expect(measured.left).toBeGreaterThanOrEqual(measured.clipLeft);
                    expect(measured.right).toBeLessThanOrEqual(measured.clipRight);
                    expect(Math.abs(measured.textCentre - measured.visibleCentre)).toBeLessThanOrEqual(1);
                });
            });
        }
    });

    test.describe("on a 360 x 640 phone", () => {
        test.use({ viewport: { width: 360, height: 640 } });
        test.beforeEach(async ({ page: _page }, testInfo) => {
            test.skip(testInfo.project.name !== "mobile-portrait", "Portrait only");
        });

        test("Sign in stays on one line, and the toolbar fits at 56px", async ({ page }) => {
            await game.goto();
            const signIn = await page.getByRole("button", { name: "Sign in" }).boundingBox();
            expect(signIn?.height).toBeLessThanOrEqual(32);

            const menuButton = page.getByRole("button", { name: "Open menu" });
            const menu = await menuButton.boundingBox();
            expect((menu?.x ?? 0) + (menu?.width ?? 0)).toBeLessThanOrEqual(360);

            // The button sits in the right section, which sits in the toolbar.
            const toolbar = await menuButton.locator("../..").boundingBox();
            expect(toolbar?.height).toBe(56);

            // With the goal sentence showing, the board must stop at the carousel's
            // 260px container, which starts at y = 380.
            await expect(page.getByTestId("goal-hint")).toBeVisible();
            const board = await game.board().boundingBox();
            expect((board?.y ?? 0) + (board?.height ?? 0)).toBeLessThanOrEqual(381);
        });
    });
});
