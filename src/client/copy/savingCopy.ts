/**
 * User-facing strings for the time when the server cannot save.
 */
export type SavingNoticeKind = "paused" | "solved-paused" | "back" | "back-saved" | "signin-failed";

export const SAVING_COPY: { notice: Record<SavingNoticeKind, string>; pausedIcon: string; hintTooltip: string; statsTooltip: string } = {
    notice: {
        "paused": "Saving is paused. Keep playing; your solves will be saved on this device and sent later.",
        "solved-paused": "Solved! Saved on this device; it will be sent when we're back.",
        "back": "Saving is back.",
        "back-saved": "Saving is back. Your solve is saved.",
        "signin-failed": "Sign-in is unavailable right now. You can keep playing."
    },
    pausedIcon: "Saving is paused",
    hintTooltip: "Hints are off while saving is paused",
    statsTooltip: "Statistics are off while saving is paused"
};
