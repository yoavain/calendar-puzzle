import type { ComponentProps } from "react";
import type { StatsModal } from "./StatsModal";
import type { IssueModal } from "./IssueModal";
import type { HelpModal } from "./HelpModal";
import type { HallOfFameModal } from "./HallOfFameModal";
import type { TokenConfirmDialog } from "./TokenConfirmDialog";
import { lazyDialog } from "./lazyDialog";

/**
 * Dialogs that load on first open. Each one loads in the background shortly after the page loads.
 * `TokenIntroDialog` and `SolvedTodayNotice` stay eager. They can open right after login.
 */

export const LazyStatsModal = lazyDialog<ComponentProps<typeof StatsModal>>(
    () => import("./StatsModal").then(module => ({ default: module.StatsModal })),
    { name: "StatsModal", isOpen: props => props.open, close: props => props.onClose() }
);

export const LazyIssueModal = lazyDialog<ComponentProps<typeof IssueModal>>(
    () => import("./IssueModal").then(module => ({ default: module.IssueModal })),
    { name: "IssueModal", isOpen: props => props.open, close: props => props.onClose() }
);

export const LazyHelpModal = lazyDialog<ComponentProps<typeof HelpModal>>(
    () => import("./HelpModal").then(module => ({ default: module.HelpModal })),
    { name: "HelpModal", isOpen: props => props.open, close: props => props.onClose() }
);

export const LazyHallOfFameModal = lazyDialog<ComponentProps<typeof HallOfFameModal>>(
    () => import("./HallOfFameModal").then(module => ({ default: module.HallOfFameModal })),
    { name: "HallOfFameModal", isOpen: props => props.open, close: props => props.onClose() }
);

export const LazyTokenConfirmDialog = lazyDialog<ComponentProps<typeof TokenConfirmDialog>>(
    () => import("./TokenConfirmDialog").then(module => ({ default: module.TokenConfirmDialog })),
    { name: "TokenConfirmDialog", isOpen: props => props.open, close: props => props.onCancel() }
);
