import React from "react";
import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";

export const BaseDialog: React.FC<DialogProps> = ({ children, slotProps: callerSlotProps, ...props }) => (
    <Dialog
        {...props}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        slotProps={{
            ...callerSlotProps,
            paper: {
                ...(callerSlotProps?.paper as object ?? {}),
                sx: { userSelect: "none", ...((callerSlotProps?.paper as { sx?: object })?.sx ?? {}) }
            }
        }}
    >
        {children}
    </Dialog>
);
