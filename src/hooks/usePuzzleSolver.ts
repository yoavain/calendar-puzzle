import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardCell, Piece, Board } from '../types/types';

interface SolverResponse {
    solution: Piece[] | null;
    error?: string;
}

export function usePuzzleSolver() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const callbackRef = useRef<((solution: Piece[] | null) => void) | null>(null);

    useEffect(() => {
        // Create worker when the hook is first used
        workerRef.current = new Worker(new URL('../workers/puzzleSolverWorker.ts', import.meta.url), { type: 'module' });

        // Set up message handler
        workerRef.current.onmessage = (event: MessageEvent<SolverResponse>) => {
            setIsLoading(false);
            
            if (event.data.error) {
                setError(event.data.error);
                if (callbackRef.current) {
                    callbackRef.current(null);
                }
            } else {
                setError(null);
                if (callbackRef.current) {
                    callbackRef.current(event.data.solution);
                }
            }
        };

        workerRef.current.onerror = (error) => {
            setIsLoading(false);
            setError(error.message);
            if (callbackRef.current) {
                callbackRef.current(null);
            }
        };

        // Clean up worker when component unmounts
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const findSolution = useCallback((
        board: Board,
        pieces: Piece[],
        currentDate: Date
    ): Promise<Piece[] | null> => {
        if (!workerRef.current) {
            setError('Worker not initialized');
            return Promise.resolve(null);
        }

        setIsLoading(true);
        setError(null);
        callbackRef.current = (solution) => {
            if (solution) {
                // Handle the solution
            } else {
                // Handle no solution
            }
        };

        // Send message to worker
        workerRef.current.postMessage({
            board,
            pieces,
            currentDate: currentDate.toISOString()
        });

        return new Promise((resolve, reject) => {
            // Add event listeners for worker messages
            const messageHandler = (event: MessageEvent<SolverResponse>) => {
                if (event.data.error) {
                    setError(event.data.error);
                    reject(event.data.error);
                } else {
                    setError(null);
                    resolve(event.data.solution);
                }
            };

            if (workerRef.current) {
                workerRef.current.addEventListener('message', messageHandler);
            }

            // Clean up event listeners on component unmount
            return () => {
                if (workerRef.current) {
                    workerRef.current.removeEventListener('message', messageHandler);
                }
            };
        });
    }, []);

    return {
        findSolution,
        isLoading,
        error
    };
}