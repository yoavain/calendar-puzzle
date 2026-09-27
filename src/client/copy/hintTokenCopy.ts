/**
 * User-facing strings for hint tokens. Chosen on the UI decision page,
 * recorded in docs/plan/2026-09-27-hint-tokens-ui-decisions.md.
 */
import type { HintAvailability, HintErrorCode } from "../../common/hintTokens";

export interface HintTokenCopy {
    hintButton: Record<HintAvailability, { label: string; tooltip: (tokenBalance: number) => string }>;
    confirm: {
        title: string;
        body: (tokenBalance: number) => string;
        earnMore: string;
        dontAskAgain: string;
        confirm: string;
        cancel: string;
    };
    intro: {
        title: string;
        steps: [string, string, string];
        firstHintFree: string;
        startingBalance: (tokenBalance: number) => string;
        newUser: string;
        balance: (tokenBalance: number) => string;
        close: string;
    };
    menu: {
        balance: (tokenBalance: number) => string;
        howItWorks: string;
    };
    /** Empty string: show nothing (the board reloads its hints instead). */
    errors: Record<HintErrorCode, string>;
}

const ALREADY_SOLVED = "This date is already solved, so tokens can't be spent on it.";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const HINT_TOKEN_COPY: HintTokenCopy = {
    hintButton: {
        "free": { label: "Hint", tooltip: () => "Get a free hint" },
        "token": { label: "Hint", tooltip: (n) => `Use 1 token for another hint (${n} left)` },
        "no-tokens": { label: "Hint", tooltip: () => "No tokens left. Solve another date to earn one." },
        "own-pieces": { label: "Hint", tooltip: () => "Reset the board to get a hint" },
        "max-reached": { label: "Hint", tooltip: () => "No more hints for this date" },
        "date-solved": { label: "Hint", tooltip: () => ALREADY_SOLVED },
        "solved": { label: "Hint", tooltip: () => "Puzzle solved" },
        "login-required": { label: "Hint", tooltip: () => "Sign-in to see hint" },
        "loading": { label: "Getting hint...", tooltip: () => "Getting hint..." }
    },
    confirm: {
        title: "Use a hint token?",
        body: (n) => `This hint costs 1 token. You have ${n}.`,
        earnMore: "Solve a date you haven't solved yet to earn more.",
        dontAskAgain: "Don't ask me again",
        confirm: "Show hint",
        cancel: "Not now"
    },
    intro: {
        title: "New: hint tokens",
        steps: ["Solve a new date", "Earn 1 token", "Spend it on an extra hint"],
        firstHintFree: "The first hint on each date stays free.",
        startingBalance: (n) => `You start with ${plural(n, "token")}, one for each date you've solved.`,
        newUser: "You start with 0 tokens. Solve any date to earn your first one.",
        balance: (n) => `You have ${plural(n, "token")}.`,
        close: "Got it"
    },
    menu: {
        balance: (n) => `Hint tokens: ${n}`,
        howItWorks: "How it works"
    },
    errors: {
        NO_TOKENS: "No hint tokens left. Solve another date to earn one.",
        ALREADY_SOLVED,
        STALE_HINT_NUMBER: ""
    }
};
