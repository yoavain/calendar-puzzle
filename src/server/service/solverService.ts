import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { Piece, PuzzleDate } from '../../common/types.js';
import * as solutionRepository from '../db/solutionRepository.js';

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
function getWorkerPath(): string {
    // Use process.cwd() as the base - this is the project root
    const projectRoot = process.cwd();
    
    // Try production path first (built .js file)
    const prodPath = path.join(projectRoot, 'dist', 'server', 'workers', 'puzzleSolverWorker.js');
    if (fs.existsSync(prodPath)) {
        return prodPath;
    }
    
    // Fall back to development path (.ts file with tsx)
    return path.join(projectRoot, 'src', 'server', 'workers', 'puzzleSolverWorker.ts');
}

/**
 * Format month and day into a date key for caching (MM-DD format)
 */
function toDateKey(month: number, day: number): string {
    return `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Solve the puzzle using a worker thread (internal implementation)
 */
function solveWithWorker(month: number, day: number): Promise<Piece[]> {
    return new Promise((resolve, reject) => {
        const workerPath = getWorkerPath();
        
        // For .ts files, we need to use tsx's ESM loader
        const workerOptions = workerPath.endsWith('.ts') 
            ? { execArgv: ['--import', 'tsx/esm'] }
            : {};
        
        const worker = new Worker(workerPath, workerOptions);

        worker.on('message', (response: SolverResponse) => {
            worker.terminate();
            if (response.success && response.pieces) {
                resolve(response.pieces);
            } else {
                reject(new Error(response.error || 'Failed to solve puzzle'));
            }
        });

        worker.on('error', (error) => {
            worker.terminate();
            reject(error);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });

        // Send the solve request (matches PuzzleDate structure)
        const request: SolverRequest = { month, day };
        worker.postMessage(request);
    });
}

/**
 * Solve the puzzle for a given date, using cache when available
 * @param month - 0-indexed month (0-11) from PuzzleDate
 * @param day - 1-indexed day (1-31) from PuzzleDate
 * @returns Promise resolving to the solution pieces
 */
export async function solvePuzzle(month: number, day: number): Promise<Piece[]> {
    const dateKey = toDateKey(month, day);
    
    // Check cache first
    const cached = await solutionRepository.getSolution(dateKey);
    if (cached) {
        return cached;
    }
    
    // Solve with worker and cache the result
    const pieces = await solveWithWorker(month, day);
    await solutionRepository.saveSolution(dateKey, pieces);
    return pieces;
}
