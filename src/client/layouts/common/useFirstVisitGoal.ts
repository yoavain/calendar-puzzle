import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";

const STORAGE_KEY = "puzzle:goalSeen";

const hasSeenGoal = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === "true";
    }
    catch {
        return false;
    }
};

const markGoalSeen = (): void => {
    try {
        localStorage.setItem(STORAGE_KEY, "true");
    }
    catch {
        // Without storage the player sees the sentence once per visit.
    }
};

/**
 * Decides whether to show the goal sentence to a new player.
 *
 * `hasSlot` says whether the sentence takes up space. The space stays until the
 * next page load after the first placement, so the board does not jump under
 * the piece that just landed. `shown` says whether the sentence is visible.
 *
 * A session with placed pieces, or a signed-in account with play history, marks
 * a returning player, so a player from before this flag never sees the sentence.
 */
export function useFirstVisitGoal(placedCount: number): { hasSlot: boolean; shown: boolean } {
    const { loading, completedDates, playedDates } = useUser();
    const [isNewPlayer] = useState(() => !hasSeenGoal() && placedCount === 0);
    const [hasPlaced, setHasPlaced] = useState(false);
    const [isReturningAccount, setIsReturningAccount] = useState(false);

    if (placedCount > 0 && !hasPlaced) {
        setHasPlaced(true);
    }
    // Only history from before the first placement counts: that placement adds
    // to playedDates, and the slot must not collapse in response.
    if (!hasPlaced && placedCount === 0 && !isReturningAccount && (completedDates.length > 0 || playedDates.length > 0)) {
        setIsReturningAccount(true);
    }

    const isFinished = hasPlaced || isReturningAccount;
    useEffect(() => {
        if (isFinished) {
            markGoalSeen();
        }
    }, [isFinished]);

    const hasSlot = isNewPlayer && !isReturningAccount;
    return { hasSlot, shown: hasSlot && !hasPlaced && !loading };
}
