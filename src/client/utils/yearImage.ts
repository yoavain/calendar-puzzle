/**
 * Renders the "every date on the calendar" card to a canvas and hands it to
 * the browser as a download, a share sheet or the clipboard.
 *
 * Drawn directly rather than rasterising the DOM: the mosaic is 366 rounded
 * rects plus three lines of text, so this needs no html-to-image dependency
 * and export is a plain `canvas.toBlob()`.
 *
 * The card is deliberately theme-independent — every shared image should look
 * the same regardless of the sharer's colour mode.
 */

import { DAYS_IN_MONTH, MONTHS, SHARE_URL, TOTAL_DATES } from "../../common/consts";
import { BADGE_VIEWBOX, buildBadgePalette, buildBadgeShapes } from "./badgeGeometry";
import { getMosaicColor } from "./pieceColors";

const FILE_NAME = "calendar-puzzle-366.png";

const CARD = {
    width: 1200,
    height: 900,
    scale: 2,
    background: "#16181c",
    text: "#ffffff",
    muted: "#7e848d",
    divider: "#ffffff14",
    padding: 80,
    labelWidth: 62,
    gridTop: 88,
    cellGap: 6,
    cellRadius: 3,
    badgeSize: 92,
    badgeGap: 48,
    bodyFont: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    monoFont: "ui-monospace, \"Cascadia Mono\", Consolas, monospace"
} as const;

export interface YearImageLayout {
    width: number;
    height: number;
    padding: number;
    cell: number;
    gap: number;
    gridLeft: number;
    gridTop: number;
    gridHeight: number;
    labelRight: number;
    badgeX: number;
    badgeY: number;
    badgeSize: number;
    countBaseline: number;
    titleBaseline: number;
    dividerY: number;
    urlBaseline: number;
}

/**
 * Pure layout maths, split out from the drawing so it can be unit-tested
 * (jsdom has no canvas).
 */
export const computeYearImageLayout = (): YearImageLayout => {
    const gridLeft = CARD.padding + CARD.labelWidth;
    const gridWidth = CARD.width - CARD.padding - gridLeft;
    const columns = Math.max(...DAYS_IN_MONTH);
    const rows = MONTHS.length;

    const cell = (gridWidth - (columns - 1) * CARD.cellGap) / columns;
    const gridHeight = rows * cell + (rows - 1) * CARD.cellGap;
    const badgeY = CARD.gridTop + gridHeight + CARD.badgeGap;

    return {
        width: CARD.width,
        height: CARD.height,
        padding: CARD.padding,
        cell,
        gap: CARD.cellGap,
        gridLeft,
        gridTop: CARD.gridTop,
        gridHeight,
        labelRight: gridLeft - 16,
        badgeX: (CARD.width - CARD.badgeSize) / 2,
        badgeY,
        badgeSize: CARD.badgeSize,
        countBaseline: badgeY + CARD.badgeSize + 74,
        titleBaseline: badgeY + CARD.badgeSize + 126,
        dividerY: CARD.height - 88,
        urlBaseline: CARD.height - 54
    };
};

/** `roundRect` is recent enough to be worth a square-cornered fallback. */
const fillRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
): void => {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, width, height, radius);
    }
    else {
        ctx.rect(x, y, width, height);
    }
    ctx.fill();
};

const drawMosaic = (ctx: CanvasRenderingContext2D, layout: YearImageLayout): void => {
    for (let month = 0; month < MONTHS.length; month++) {
        const y = layout.gridTop + month * (layout.cell + layout.gap);

        ctx.fillStyle = CARD.muted;
        ctx.font = `600 ${Math.round(layout.cell * 0.72)}px ${CARD.monoFont}`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(MONTHS[month].toUpperCase(), layout.labelRight, y + layout.cell / 2);

        ctx.fillStyle = getMosaicColor(month);
        for (let day = 0; day < DAYS_IN_MONTH[month]; day++) {
            const x = layout.gridLeft + day * (layout.cell + layout.gap);
            fillRoundRect(ctx, x, y, layout.cell, layout.cell, CARD.cellRadius);
        }
    }
};

const drawBadge = (
    ctx: CanvasRenderingContext2D,
    layout: YearImageLayout,
    gold: string
): void => {
    const palette = buildBadgePalette(gold);
    const unit = layout.badgeSize / BADGE_VIEWBOX;

    ctx.save();
    ctx.translate(layout.badgeX, layout.badgeY);
    ctx.scale(unit, unit);

    const face = ctx.createLinearGradient(0, 0, BADGE_VIEWBOX * 0.35, BADGE_VIEWBOX);
    face.addColorStop(0, palette.faceLight);
    face.addColorStop(0.42, palette.faceMid);
    face.addColorStop(1, palette.faceDeep);

    ctx.beginPath();
    ctx.arc(BADGE_VIEWBOX / 2, BADGE_VIEWBOX / 2, BADGE_VIEWBOX / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = face;
    ctx.fill();

    for (const shape of buildBadgeShapes(layout.badgeSize)) {
        ctx.fillStyle = shape.tone === "lit" ? palette.lit : palette.engraved;
        fillRoundRect(ctx, shape.x, shape.y, shape.width, shape.height, shape.radius);
    }

    ctx.restore();
};

/**
 * Paints the card. Sizes the canvas itself, so callers only need to supply an
 * element (on-screen or detached).
 */
export const renderYearImage = (canvas: HTMLCanvasElement, gold: string): void => {
    const layout = computeYearImageLayout();
    canvas.width = layout.width * CARD.scale;
    canvas.height = layout.height * CARD.scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Canvas 2D context unavailable");
    }

    ctx.scale(CARD.scale, CARD.scale);
    ctx.fillStyle = CARD.background;
    ctx.fillRect(0, 0, layout.width, layout.height);

    drawMosaic(ctx, layout);
    drawBadge(ctx, layout, gold);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = gold;
    ctx.font = `600 72px ${CARD.monoFont}`;
    ctx.fillText(`${TOTAL_DATES} / ${TOTAL_DATES}`, layout.width / 2, layout.countBaseline);

    ctx.fillStyle = CARD.text;
    ctx.font = `600 34px ${CARD.bodyFont}`;
    ctx.fillText("Every date on the calendar", layout.width / 2, layout.titleBaseline);

    ctx.fillStyle = CARD.divider;
    ctx.fillRect(layout.padding, layout.dividerY, layout.width - layout.padding * 2, 1);

    ctx.fillStyle = CARD.muted;
    ctx.font = `500 18px ${CARD.monoFont}`;
    // Protocol kept so the footer reads unambiguously as a URL.
    ctx.fillText(
        SHARE_URL.toUpperCase(),
        layout.width / 2,
        layout.urlBaseline
    );
};

const toPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => blob ? resolve(blob) : reject(new Error("Failed to encode image")),
            "image/png"
        );
    });

const download = (blob: Blob): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
};

/** Hands the PNG to the browser's download flow. */
export const saveYearImage = async (canvas: HTMLCanvasElement): Promise<void> => {
    download(await toPngBlob(canvas));
};

/** How `shareYearImage` delivered the image, so the UI can say what happened. */
export type ShareOutcome = "shared" | "copied" | "downloaded";

/**
 * Probes for file sharing without a real blob — the decision has to be made
 * before any `await`, because Safari rejects a `ClipboardItem` built after one.
 */
export const canShareImage = (): boolean => {
    if (typeof navigator === "undefined" || !navigator.canShare || !navigator.share) {
        return false;
    }
    try {
        return navigator.canShare({ files: [new File([], FILE_NAME, { type: "image/png" })] });
    }
    catch {
        return false;
    }
};

/**
 * Native share sheet where one exists (mobile), clipboard on desktop, download
 * as the last resort.
 */
export const shareYearImage = async (canvas: HTMLCanvasElement): Promise<ShareOutcome> => {
    if (canShareImage()) {
        const blob = await toPngBlob(canvas);
        await navigator.share({
            files: [new File([blob], FILE_NAME, { type: "image/png" })],
            title: "Calendar Puzzle"
        });
        return "shared";
    }

    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        // The promise — not the resolved blob — must be handed over inside the
        // click gesture, or Safari rejects the write.
        await navigator.clipboard.write([new ClipboardItem({ "image/png": toPngBlob(canvas) })]);
        return "copied";
    }

    download(await toPngBlob(canvas));
    return "downloaded";
};
