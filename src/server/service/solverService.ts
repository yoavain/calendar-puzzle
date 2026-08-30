import { Worker } from "node:worker_threads";
import path from "node:path";
import fs from "node:fs/promises";
import type { FastifyBaseLogger } from "fastify";
import type { Piece, PuzzleDate } from "../../common/types.js";
import * as solutionRepository from "../db/solutionRepository.js";
import { config } from "../config.js";
import { hashString } from "../utils/dateUtils.js";

// Worker message format matches PuzzleDate structure
type SolverRequest = PuzzleDate;

interface SolverResponse {
    success: boolean;
    pieces?: Piece[];
    error?: string;
}

/**
 * Get the worker path - handles both development and production environments
 */
const getWorkerPath = async (): Promise<string> => {
    // Use config.paths.root as the base - this is the project root
    const projectRoot = config.paths.root;
    
    // Try production path first (built .js file)
    const prodPath = path.join(projectRoot, "dist", "server", "workers", "puzzleSolverWorker.js");
    try {
        await fs.access(prodPath);
        return prodPath;
    }
    catch {
        // Fall back to development path (.ts file with tsx)
        return path.join(projectRoot, "src", "server", "workers", "puzzleSolverWorker.ts");
    }
};

/**
 * Format month and day into a date key for caching (MM-DD format)
 */
const toDateKey = (month: number, day: number): string => {
    return `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

/**
 * Solve the puzzle using a worker thread (internal implementation)
 */
const solveWithWorker = async (month: number, day: number): Promise<Piece[]> => {
    const workerPath = await getWorkerPath();
    return new Promise((resolve, reject) => {
        // For .ts files, we need to use tsx's ESM loader
        const workerOptions = workerPath.endsWith(".ts")
            ? { execArgv: ["--import", "tsx/esm"] }
            : {};

        const worker = new Worker(workerPath, workerOptions);
        let settled = false;

        worker.on("message", (response: SolverResponse) => {
            settled = true;
            worker.terminate().catch(() => {});
            if (response.success && response.pieces) {
                resolve(response.pieces);
            }
            else {
                reject(new Error(response.error || "Failed to solve puzzle"));
            }
        });

        worker.on("error", (error) => {
            settled = true;
            worker.terminate().catch(() => {});
            reject(error);
        });

        worker.on("exit", (code) => {
            if (!settled && code !== 0) {
                settled = true;
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });

        // Send the solve request (matches PuzzleDate structure)
        const request: SolverRequest = { month, day };
        worker.postMessage(request);
    });
};

/**
 * Solve the puzzle for a given date, using cache when available
 * @param month - 0-indexed month (0-11) from PuzzleDate
 * @param day - 1-indexed day (1-31) from PuzzleDate
 * @returns Promise resolving to the solution pieces
 */
export const solvePuzzle = async (month: number, day: number, log: FastifyBaseLogger): Promise<Piece[]> => {
    const dateKey = toDateKey(month, day);
    log.info({ dateKey }, "[SolverService] Solving puzzle");
    
    // Check cache first
    const cached = await solutionRepository.getSolution(dateKey, log);
    if (cached) {
        log.info({ dateKey }, "[SolverService] Returning cached solution");
        return cached;
    }
    
    // Solve with worker and cache the result
    log.info({ dateKey }, "[SolverService] Computing solution");
    const pieces = await solveWithWorker(month, day);
    await solutionRepository.saveSolution(dateKey, pieces, log);
    log.info({ dateKey }, "[SolverService] Solution computed and cached");
    return pieces;
};

/**
 * Get a deterministic hint piece for a given date
 */
export const getHintPiece = async (month: number, day: number, log: FastifyBaseLogger): Promise<Piece> => {
    const pieces = await solvePuzzle(month, day, log);
    const placedPieces = pieces.filter(p => p.position !== null);

    if (placedPieces.length === 0) {
        throw new Error("No placed pieces found in solution");
    }

    const dateKey = toDateKey(month, day);
    const pieceIndex = hashString(dateKey) % 8;
    return placedPieces[pieceIndex % placedPieces.length];
};
