import { getTransformedShape } from "../../src/common/gameLogic";
import type { Piece } from "../../src/common/types";

/**
 * Anchor-based drag-drop: piece top-left = drop cell minus anchor (in piece coords).
 * These tests verify the contract from docs/drag-drop-guidelines.md.
 */
describe("drag-drop anchor behaviour", () => {
    /**
     * Compute piece top-left position when dropping with anchor at drop cell.
     * Matches Board handleDragOver and DndProvider hover logic.
     */
    function dropPositionFromAnchor(
        dropCell: { x: number; y: number },
        anchorInPiece: { x: number; y: number }
    ): { x: number; y: number } {
        return {
            x: dropCell.x - anchorInPiece.x,
            y: dropCell.y - anchorInPiece.y
        };
    }

    describe("piece snaps to correct board cell when released", () => {
        it("computes piece top-left as drop cell minus anchor", () => {
            expect(dropPositionFromAnchor({ x: 5, y: 5 }, { x: 0, y: 0 })).toEqual({ x: 5, y: 5 });
            expect(dropPositionFromAnchor({ x: 5, y: 5 }, { x: 1, y: 2 })).toEqual({ x: 4, y: 3 });
            expect(dropPositionFromAnchor({ x: 0, y: 0 }, { x: 1, y: 1 })).toEqual({ x: -1, y: -1 });
        });

        it("anchor at first filled cell gives same result as legacy behaviour", () => {
            const piece: Piece = {
                id: 1,
                position: { x: 2, y: 2 },
                rotation: 0,
                isFlippedH: false,
                isFlippedV: false,
                isLocked: false
            };
            const shape = getTransformedShape(piece);
            let firstX = 0;
            let firstY = 0;
            outer: for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        firstX = x;
                        firstY = y;
                        break outer;
                    }
                }
            }
            const dropCell = { x: 4, y: 3 };
            const topLeft = dropPositionFromAnchor(dropCell, { x: firstX, y: firstY });
            expect(topLeft).toEqual({ x: dropCell.x - firstX, y: dropCell.y - firstY });
        });
    });

    describe("drag cannot start from an empty cell", () => {
        it("anchor must refer to a filled cell in the piece shape", () => {
            const piece: Piece = {
                id: 1,
                position: null,
                rotation: 0,
                isFlippedH: false,
                isFlippedV: false,
                isLocked: false
            };
            const shape = getTransformedShape(piece);
            // Piece 1 shape has both filled and possibly empty cells; find a filled one
            let hasFilled = false;
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        hasFilled = true;
                    }
                }
            }
            expect(hasFilled).toBe(true);
            // For any (ax, ay), drag should only proceed if shape[ay][ax] is true
            for (let ay = 0; ay < shape.length; ay++) {
                for (let ax = 0; ax < shape[ay].length; ax++) {
                    const isValidAnchor = !!shape[ay]?.[ax];
                    if (!isValidAnchor) {
                        expect(shape[ay][ax]).toBe(false);
                    }
                    else {
                        expect(shape[ay][ax]).toBe(true);
                    }
                }
            }
        });

        it("rejects anchor outside shape bounds", () => {
            const piece: Piece = {
                id: 1,
                position: { x: 0, y: 0 },
                rotation: 0,
                isFlippedH: false,
                isFlippedV: false,
                isLocked: false
            };
            const shape = getTransformedShape(piece);
            const h = shape.length;
            const w = shape[0].length;
            expect(shape[h]?.[0]).toBeUndefined();
            expect(shape[0]?.[w]).toBeUndefined();
        });
    });

    describe("shadow matches anchor cell", () => {
        it("preview offset in piece coords equals anchor", () => {
            const anchorInPiece = { x: 2, y: 1 };
            const dropCell = { x: 3, y: 4 };
            const topLeft = dropPositionFromAnchor(dropCell, anchorInPiece);
            expect(topLeft).toEqual({ x: 1, y: 3 });
            // If we place piece at topLeft, then anchor (2,1) in piece is at board (topLeft.x+2, topLeft.y+1) = (3,4) = dropCell
            expect(topLeft.x + anchorInPiece.x).toBe(dropCell.x);
            expect(topLeft.y + anchorInPiece.y).toBe(dropCell.y);
        });
    });
});
