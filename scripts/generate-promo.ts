/* eslint-disable no-console */
/**
 * Renders the 15-second promo video for one puzzle date.
 *
 *   npm run promo              -> today's date
 *   npm run promo -- 12-31     -> a specific date (MM-dd)
 *
 * Output: promo/MM-dd.mp4 (git-ignored). An existing file for the same date is replaced.
 *
 * PROMO_GPU=true (in .env) lets headless Chromium draw on the GPU: about 3x faster overall. Off by
 * default: GPU anti-aliasing and blur differ slightly, so the frames are not bit-identical to the
 * CPU render. Encoding is not the bottleneck (a few seconds), so ffmpeg stays on libx264.
 *
 * The composition is scripts/promo/promo.html: a deterministic canvas renderer plus an in-page
 * soundtrack synth. This script fills in the date and that date's solution from the game's own
 * solver, renders every frame in headless Chromium with 5-sample motion blur, and encodes with ffmpeg.
 *
 * Needs ffmpeg on PATH and Playwright's Chromium. Text uses the Windows fonts Bahnschrift and
 * Segoe UI; on other systems the browser substitutes fonts and the typography looks different.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { DAYS_IN_MONTH } from "../src/common/consts";
import { getTransformedShape } from "../src/common/gameLogic";
import { initializeBoard, initializePieces } from "../src/common/initialize";
import { findSolution } from "../src/common/puzzleSolver";
import type { PuzzleDate } from "../src/common/types";

const FPS = 60;
const DURATION_S = 15;
const WIDTH = 1920;
const HEIGHT = 1080;
const MOTION_BLUR_SAMPLES = 5;
// Without these, headless Chromium draws the canvas on SwiftShader (a CPU emulation of a GPU).
const GPU_ARGS = ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(ROOT, "scripts", "promo", "promo.html");
const ASSETS_DIR = path.join(ROOT, "src", "client", "assets");
const OUTPUT_DIR = path.join(ROOT, "promo");

/** Globals that promo.html exposes to this script. */
interface PromoPage {
    READY: Promise<boolean>;
    EVENTS: unknown[];
    captureFrame: (t: number, sub: number) => string;
    synthesizeAudio: (events: unknown[]) => string;
}

interface SolvedPiece {
    id: number;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    cells: [number, number][];
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Parses an optional MM-dd argument; no argument means today. */
const parseDate = (arg: string | undefined): PuzzleDate => {
    if (!arg) {
        const now = new Date();
        return { month: now.getMonth(), day: now.getDate() };
    }
    const match = /^(\d{2})-(\d{2})$/.exec(arg);
    const month = match ? Number(match[1]) - 1 : -1;
    const day = match ? Number(match[2]) : -1;
    if (month < 0 || month > 11 || day < 1 || day > DAYS_IN_MONTH[month]) {
        throw new Error(`Invalid date "${arg}". Expected MM-dd, for example 09-25 or 02-29.`);
    }
    return { month, day };
};

/** Solves the date with the game's solver and returns each piece's pose and board cells. */
const solve = (date: PuzzleDate): SolvedPiece[] => {
    const state = findSolution(initializeBoard(date), initializePieces(), date);
    if (!state) {
        throw new Error(`The solver found no solution for ${pad2(date.month + 1)}-${pad2(date.day)}.`);
    }
    return state.pieces.map(piece => {
        if (!piece.position) {
            throw new Error(`Piece ${piece.id} is not on the board in the solution.`);
        }
        const { x: px, y: py } = piece.position;
        const cells: [number, number][] = [];
        getTransformedShape(piece).forEach((row, y) => row.forEach((filled, x) => {
            if (filled) {
                cells.push([px + x, py + y]);
            }
        }));
        return { id: piece.id, rotation: piece.rotation, flipH: piece.isFlippedH, flipV: piece.isFlippedV, cells };
    });
};

const dataUri = (file: string): string =>
    "data:image/png;base64," + fs.readFileSync(path.join(ASSETS_DIR, file)).toString("base64");

/** Writes the template with the date, solution, and wordmark images filled in. */
const buildPage = (date: PuzzleDate, solution: SolvedPiece[], dir: string): string => {
    const values: Record<string, string> = {
        __CAL__: dataUri("CALENDAR.png"),
        __PUZ__: dataUri("PUZZLE.png"),
        __SOL__: JSON.stringify(solution),
        __DATE__: JSON.stringify(date)
    };
    let html = fs.readFileSync(TEMPLATE, "utf8");
    for (const [key, value] of Object.entries(values)) {
        if (!html.includes(key)) {
            throw new Error(`Placeholder ${key} is missing from ${TEMPLATE}.`);
        }
        html = html.replace(key, () => value);
    }
    const file = path.join(dir, "promo.html");
    fs.writeFileSync(file, html);
    return file;
};

const runFfmpeg = (args: string[]): void => {
    const result = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
    if (result.error || result.status !== 0) {
        throw new Error(`ffmpeg failed: ${result.error?.message ?? `exit code ${result.status}`}`);
    }
};

const assertFfmpeg = (): void => {
    if (spawnSync("ffmpeg", ["-version"]).error) {
        throw new Error("ffmpeg was not found on PATH.");
    }
};

const render = async (pageFile: string, workDir: string, outFile: string, useGpu: boolean): Promise<void> => {
    const browser = await chromium.launch({ args: useGpu ? GPU_ARGS : [] });
    try {
        const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
        page.on("pageerror", err => console.error("Page error:", err));
        await page.goto(pathToFileURL(pageFile).href);
        await page.evaluate(() => (window as unknown as PromoPage).READY);

        // Soundtrack: synthesized in the page from the renderer's cue sheet, then loudness-normalized.
        const wavBase64 = await page.evaluate(() => {
            const promo = window as unknown as PromoPage;
            return promo.synthesizeAudio(promo.EVENTS);
        });
        const rawWav = path.join(workDir, "audio.wav");
        const normWav = path.join(workDir, "audio.norm.wav");
        fs.writeFileSync(rawWav, Buffer.from(wavBase64, "base64"));
        runFfmpeg(["-i", rawWav, "-af", "loudnorm=I=-14:TP=-1.0:LRA=7", "-ar", "48000", normWav]);

        const encoder = spawn("ffmpeg", [
            "-y", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${WIDTH}x${HEIGHT}`, "-framerate", String(FPS), "-i", "-",
            "-i", normWav,
            "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-profile:v", "high",
            "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart",
            "-f", "mp4", outFile
        ], { stdio: ["pipe", "inherit", "inherit"] });
        const encoded = new Promise<number | null>((resolve, reject) => {
            encoder.on("error", reject);
            encoder.on("close", resolve);
        });

        const frames = FPS * DURATION_S;
        const started = Date.now();
        /* eslint-disable no-await-in-loop -- frames render one at a time, in order, into the encoder pipe */
        for (let i = 0; i < frames; i++) {
            const rgb = await page.evaluate(([t, sub]) => (window as unknown as PromoPage).captureFrame(t, sub), [i / FPS, MOTION_BLUR_SAMPLES]);
            if (!encoder.stdin.write(Buffer.from(rgb, "base64"))) {
                await new Promise<void>(resolve => {
                    encoder.stdin.once("drain", () => resolve());
                });
            }
            if (i % FPS === FPS - 1) {
                const elapsed = (Date.now() - started) / 1000;
                const eta = elapsed / (i + 1) * (frames - i - 1);
                console.log(`  ${i + 1}/${frames} frames, about ${Math.ceil(eta / 60)} min left`);
            }
        }
        /* eslint-enable no-await-in-loop */
        encoder.stdin.end();
        const code = await encoded;
        if (code !== 0) {
            throw new Error(`ffmpeg encoding failed with exit code ${code}.`);
        }
    }
    finally {
        await browser.close();
    }
};

const main = async (): Promise<void> => {
    const date = parseDate(process.argv[2]);
    const name = `${pad2(date.month + 1)}-${pad2(date.day)}`;
    const useGpu = process.env.PROMO_GPU === "true";
    assertFfmpeg();

    console.log(`Solving ${name}...`);
    const solution = solve(date);

    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "calendar-puzzle-promo-"));
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outFile = path.join(OUTPUT_DIR, `${name}.mp4`);
    const partFile = path.join(OUTPUT_DIR, `.${name}.partial.mp4`);
    try {
        console.log(`Rendering ${FPS * DURATION_S} frames on the ${useGpu ? "GPU (PROMO_GPU=true)" : "CPU"}...`);
        await render(buildPage(date, solution, workDir), workDir, partFile, useGpu);
        fs.renameSync(partFile, outFile);
        console.log(`Done: ${path.relative(ROOT, outFile)}`);
    }
    finally {
        fs.rmSync(partFile, { force: true });
        fs.rmSync(workDir, { recursive: true, force: true });
    }
};

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
