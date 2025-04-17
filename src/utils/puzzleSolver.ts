import type { GameState, Board, Piece, Position, BoardCell } from '../types/types';
import { getTransformedShape } from './gameLogic';
import { MONTHS } from './initialize';
import dlx from 'dlx';

class DLXSolver {
    private matrix: number[][];
    private rowData: Map<number, { piece: Piece, pos: Position, transformation: Omit<Piece, 'shape' | 'id' | 'color'>}>;
    private solution: number[] | null = null;

    constructor(board: Board, pieces: Piece[], date: Date) {
        this.rowData = new Map();
        const { matrix, rowData } = this.buildMatrix(board, pieces, date);
        this.matrix = matrix;
        this.rowData = rowData;
    }

    private getPlayableCells(board: Board): BoardCell[] {
        const playableCells: BoardCell[] = [];
        board.forEach(row => row.forEach(cell => {
            if (cell.isPlayable) {
                playableCells.push(cell);
            }
        }));
        return playableCells;
    }

    private isDateCell(cell: BoardCell, date: Date): boolean {
        const monthName = MONTHS[date.getMonth()];
        const dayNum = date.getDate();
        return (cell.y < 2 && cell.content === monthName) || (cell.y >= 2 && parseInt(cell.content || '-1') === dayNum);
    }

    private buildMatrix(board: Board, pieces: Piece[], date: Date): { 
        matrix: number[][], 
        rowData: Map<number, { piece: Piece, pos: Position, transformation: Omit<Piece, 'shape' | 'id' | 'color'>}>
    } {
        const playableCells = this.getPlayableCells(board);
        const dateCells = new Set<string>(playableCells.filter(c => this.isDateCell(c, date)).map(c => `${c.x},${c.y}`));
        
        // Create column mapping for cells and pieces
        const cellColumns = new Map<string, number>();
        const pieceColumns = new Map<number, number>();
        let columnIndex = 0;

        // Map non-date cell columns
        playableCells.forEach(cell => {
            const key = `${cell.x},${cell.y}`;
            if (!dateCells.has(key)) {
                cellColumns.set(key, columnIndex++);
            }
        });

        // Map piece columns
        pieces.forEach(piece => {
            pieceColumns.set(piece.id, columnIndex++);
        });

        const totalColumns = columnIndex;
        const matrix: number[][] = [];
        const rowData = new Map();

        // Generate rows for each valid piece placement
        pieces.forEach(piece => {
            const uniqueTransformations = this.getUniqueTransformations(piece);

            uniqueTransformations.forEach(transformation => {
                const transformedPiece = { ...piece, ...transformation };
                const shape = getTransformedShape(transformedPiece);
                const shapeHeight = shape.length;
                const shapeWidth = shape[0].length;

                for (let y = 0; y <= board.length - shapeHeight; y++) {
                    for (let x = 0; x <= board[0].length - shapeWidth; x++) {
                        const pos = { x, y };
                        const coveredCells: string[] = [];
                        let isValid = true;
                        let coversDateCell = false;

                        // Check each cell the piece would cover
                        for (let dy = 0; dy < shapeHeight && !coversDateCell && isValid; dy++) {
                            for (let dx = 0; dx < shapeWidth && !coversDateCell && isValid; dx++) {
                                if (shape[dy][dx]) {
                                    const boardY = y + dy;
                                    const boardX = x + dx;
                                    const cellKey = `${boardX},${boardY}`;

                                    // Check bounds and if cell is playable
                                    const boardCell = board[boardY]?.[boardX];
                                    if (!boardCell || !boardCell.isPlayable) {
                                        isValid = false;
                                        break;
                                    }

                                    // Check if it covers a date cell
                                    if (dateCells.has(cellKey)) {
                                        coversDateCell = true;
                                        break;
                                    }

                                    coveredCells.push(cellKey);
                                }
                            }
                        }

                        if (isValid && !coversDateCell && coveredCells.length > 0) {
                            // Create a row for this valid placement
                            const row = new Array(totalColumns).fill(0);
                            
                            // Set 1 for the piece constraint
                            const pieceCol = pieceColumns.get(piece.id);
                            if (pieceCol !== undefined) {
                                row[pieceCol] = 1;
                            }

                            // Set 1s for covered cells
                            coveredCells.forEach(cellKey => {
                                const cellCol = cellColumns.get(cellKey);
                                if (cellCol !== undefined) {
                                    row[cellCol] = 1;
                                }
                            });

                            matrix.push(row);
                            // Use the current matrix length - 1 as the row index
                            rowData.set(matrix.length - 1, { piece, pos, transformation });
                        }
                    }
                }
            });
        });

        return { matrix, rowData };
    }

    // Helper to get unique transformations (rotations/flips)
    private getUniqueTransformations(piece: Piece): Omit<Piece, 'shape' | 'id' | 'color'>[] {
        const transformations = new Set<string>();
        const results: Omit<Piece, 'shape' | 'id' | 'color'>[] = [];
        const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];

        for (const rotation of rotations) {
            for (const isFlippedH of [false, true]) {
                for (const isFlippedV of [false, true]) {
                    const tempPiece = { ...piece, rotation, isFlippedH, isFlippedV };
                    const shape = getTransformedShape(tempPiece);
                    const shapeString = shape.map(r => r.map(c => c ? '1' : '0').join('')).join('|');

                    if (!transformations.has(shapeString)) {
                        transformations.add(shapeString);
                        results.push({ rotation, isFlippedH, isFlippedV, position: null });
                    }
                }
            }
        }
        return results;
    }

    public search(): boolean {
        try {
            const solutions = dlx.solve(this.matrix);
            if (solutions && Array.isArray(solutions) && solutions.length > 0) {
                // Take the first solution (we only need one valid solution)
                const solution = solutions[0];
                if (!Array.isArray(solution)) {
                    console.error("DLX: Solution is not an array");
                    return false;
                }
                // Verify that we have all the necessary rows in our rowData
                const allRowsExist = solution.every((rowIndex: number) => {
                    const exists = this.rowData.has(rowIndex);
                    if (!exists) {
                        console.error(`Missing row data for index ${rowIndex}`);
                    }
                    return exists;
                });
                if (!allRowsExist) {
                    console.error("DLX: Invalid row indices in solution");
                    return false;
                }
                this.solution = solution;
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error during DLX solving:", error);
            return false;
        }
    }

    public getSolution(): { piece: Piece, pos: Position, transformation: Omit<Piece, 'shape' | 'id' | 'color'>}[] | null {
        if (!this.solution) return null;
        // Map each row index to its corresponding piece data
        const result = this.solution.map(rowIndex => {
            const data = this.rowData.get(rowIndex);
            if (!data) {
                throw new Error(`Missing row data for index ${rowIndex}`);
            }
            return data;
        });
        return result;
    }
}

/**
 * Main solution finder using DLX
 */
export function findSolution(initialBoard: Board, initialPieces: Piece[], date: Date): GameState | null {
    try {
        const solver = new DLXSolver(initialBoard, initialPieces, date);
        const found = solver.search();

        if (!found) {
            console.log("DLX: No solution found.");
            return null;
        }

        const solutionPlacements = solver.getSolution();
        if (!solutionPlacements) {
            console.log("DLX: Solution found but failed to retrieve placements.");
            return null;
        }

        // Reconstruct the final GameState
        const finalBoard = initialBoard.map(row => row.map(cell => ({ ...cell, isOccupied: false })));
        const finalPieces: Piece[] = [];

        // Mark board cells as occupied and set final piece states
        solutionPlacements.forEach(({ piece: originalPiece, pos, transformation }) => {
            const finalPiece: Piece = {
                ...originalPiece,
                position: pos,
                rotation: transformation.rotation,
                isFlippedH: transformation.isFlippedH,
                isFlippedV: transformation.isFlippedV,
            };
            finalPieces.push(finalPiece);

            const shape = getTransformedShape(finalPiece);
            for (let dy = 0; dy < shape.length; dy++) {
                for (let dx = 0; dx < shape[0].length; dx++) {
                    if (shape[dy][dx]) {
                        const boardY = pos.y + dy;
                        const boardX = pos.x + dx;
                        if (finalBoard[boardY]?.[boardX]) {
                            finalBoard[boardY][boardX].isOccupied = true;
                        }
                    }
                }
            }
        });

        // Ensure all original pieces are accounted for
        initialPieces.forEach(p => {
            if (!finalPieces.some(fp => fp.id === p.id)) {
                console.warn(`Piece ${p.id} missing from DLX solution, adding.`);
                finalPieces.push({ ...p, position: null });
            }
        });

        return {
            board: finalBoard,
            pieces: finalPieces.sort((a, b) => a.id - b.id),
            selectedPieceId: null,
            currentDate: date,
            isSolved: true,
            isGameComplete: true
        };

    } catch (error) {
        console.error("Error during DLX solving:", error);
        return null;
    }
}
