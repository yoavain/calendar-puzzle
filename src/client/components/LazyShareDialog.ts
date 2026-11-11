import type { ComponentProps } from "react";
import type { ShareDialog } from "./ShareDialog";
import { lazyDialog } from "./lazyDialog";

/**
 * The Share dialog loads on first open. Its QR code is a 37 KB SVG that no other screen needs.
 */
export const LazyShareDialog = lazyDialog<ComponentProps<typeof ShareDialog>>(
    () => import("./ShareDialog").then(module => ({ default: module.ShareDialog })),
    "ShareDialog"
);
