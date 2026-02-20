import React from "react";
import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";

export const BaseDialog: React.FC<DialogProps> = ({ children, PaperProps: callerPaperProps, ...props }) => (
    <Dialog
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{
            ...callerPaperProps,
            sx: { userSelect: "none", ...(callerPaperProps?.sx as object ?? {}) }
        }}
        {...props}
    >
        {children}
    </Dialog>
);
