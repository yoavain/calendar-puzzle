import React from "react";
import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import type { PaperProps } from "@mui/material/Paper";

// `compact` is for a short confirm. `default` is for forms and documents.
const MAX_WIDTH_BY_SIZE = { compact: "xs", default: "sm" } as const;

export interface BaseDialogProps extends Omit<DialogProps, "maxWidth" | "fullWidth"> {
    size?: keyof typeof MAX_WIDTH_BY_SIZE;
}

export const BaseDialog: React.FC<BaseDialogProps> = ({ children, size = "default", slotProps: callerSlotProps, ...props }) => {
    const callerPaper = callerSlotProps?.paper as PaperProps | undefined;
    const callerSx = callerPaper?.sx ?? [];

    return (
        <Dialog
            {...props}
            maxWidth={MAX_WIDTH_BY_SIZE[size]}
            fullWidth
            disableScrollLock
            slotProps={{
                ...callerSlotProps,
                paper: {
                    ...callerPaper,
                    // An sx array, because spreading a function sx into an object yields nothing.
                    sx: [{ userSelect: "none" }, ...(Array.isArray(callerSx) ? callerSx : [callerSx])]
                }
            }}
        >
            {children}
        </Dialog>
    );
};
