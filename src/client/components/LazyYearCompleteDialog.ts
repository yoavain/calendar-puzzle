import type { ComponentProps } from "react";
import type { YearCompleteDialog } from "./YearCompleteDialog";
import { lazyDialog } from "./lazyDialog";

/**
 * The year-complete dialog loads on first open, together with the canvas image code.
 * Few players reach it, so the chunk does not load in the background.
 */
export const LazyYearCompleteDialog = lazyDialog<ComponentProps<typeof YearCompleteDialog>>(
    () => import("./YearCompleteDialog").then(module => ({ default: module.YearCompleteDialog })),
    { name: "YearCompleteDialog", isOpen: props => props.isOpen, close: props => props.onClose(), preload: false }
);
