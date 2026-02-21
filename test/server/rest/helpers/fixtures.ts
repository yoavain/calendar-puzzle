import type { SessionUser } from "../../../../src/server/auth/passport";
import type { Piece } from "../../../../src/common/types";

export const mockUser: SessionUser = {
    id: "user-test-123",
    isAdmin: false,
    email: "test@example.com",
    name: "Test User"
};

export const mockPiece: Piece = {
    id: 1,
    position: { x: 0, y: 0 },
    isFlippedH: false,
    isFlippedV: false,
    rotation: 0
};

/** Build an array of 8 syntactically-valid pieces for stats/complete requests. */
export const makeEightPieces = (): Piece[] =>
    Array.from({ length: 8 }, (_, i) => ({
        id: (i + 1) as Piece["id"],
        position: { x: i, y: 0 },
        isFlippedH: false,
        isFlippedV: false,
        rotation: 0 as const
    }));
