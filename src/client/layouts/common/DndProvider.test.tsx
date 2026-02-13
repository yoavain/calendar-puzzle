import { calculateCellFromPointer } from "../../utils/dragHelpers";

// Mock HTMLElement with getBoundingClientRect
class MockElement {
    left = 0;
    top = 0;
    getBoundingClientRect() {
        return {
            left: this.left,
            top: this.top,
            width: 400,
            height: 400,
            bottom: 400,
            right: 400,
            x: this.left,
            y: this.top,
            toJSON: () => ({})
        } as DOMRect;
    }
}

test("calculateCellFromPointer without offset", () => {
    const elem = new MockElement();
    const cellSize = 50; // each cell 50px
    const scale = 1;
    // pointer at (75,75) should be cell (1,1)
    const pos = calculateCellFromPointer(75, 75, elem as any, scale, cellSize);
    expect(pos).toEqual({ x: 1, y: 1 });

    // pointer at (25,25) should be cell (0,0)
    const pos2 = calculateCellFromPointer(25, 25, elem as any, scale, cellSize);
    expect(pos2).toEqual({ x: 0, y: 0 });

    // pointer outside bounds returns null
    const pos3 = calculateCellFromPointer(-10, 0, elem as any, scale, cellSize);
    expect(pos3).toBeNull();
});
