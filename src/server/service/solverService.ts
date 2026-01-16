import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { Piece } from '../../common/types.js';

interface SolverRequest {
    month: number; // 0-indexed (0-11)
    day: number;   // 1-indexed (1-31)
}

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
 * Solve the puzzle for a given date using a worker thread
 * @param month - 0-indexed month (0-11)
 * @param day - 1-indexed day (1-31)
 * @returns Promise resolving to the solution pieces or null if no solution
 */
export async function solvePuzzle(month: number, day: number): Promise<Piece[]> {
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

        // Send the solve request
        worker.postMessage({ month, day } as SolverRequest);
    });
}
