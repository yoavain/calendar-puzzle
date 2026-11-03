import React, { useEffect, useRef, useState } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Modal from "@mui/material/Modal";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { BaseDialog } from "./BaseDialog";
import { VisuallyHidden } from "./VisuallyHidden";
import { SHARE_URL } from "../../common/consts";
import QrSvgRaw from "../assets/QR.svg?raw";

const QrSvg = `data:image/svg+xml;utf8,${encodeURIComponent(QrSvgRaw)}`;

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
}

const COPY_RESULT_MS = 2000;

export const ShareDialog: React.FC<ShareDialogProps> = ({ open, onClose }) => {
    const [copyResult, setCopyResult] = useState<"copied" | "failed" | null>(null);
    const copyResultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [qrEnlarged, setQrEnlarged] = useState(false);

    useEffect(() => {
        if (!open) {
            setCopyResult(null);
            setQrEnlarged(false);
        }
    }, [open]);

    const clearCopyResultTimer = () => {
        if (copyResultTimer.current !== null) {
            clearTimeout(copyResultTimer.current);
            copyResultTimer.current = null;
        }
    };

    useEffect(() => clearCopyResultTimer, []);

    const handleCopy = async () => {
        clearCopyResultTimer();
        try {
            await navigator.clipboard.writeText(SHARE_URL);
            setCopyResult("copied");
        }
        catch {
            // A browser can refuse the clipboard, or not offer it at all. The address stays selectable.
            setCopyResult("failed");
        }
        copyResultTimer.current = setTimeout(() => setCopyResult(null), COPY_RESULT_MS);
    };

    return (
        <>
            <BaseDialog open={open} onClose={onClose}>
                <DialogTitle sx={{ m: 0, p: 2, textAlign: "center", fontWeight: "bold" }}>
                    Share
                </DialogTitle>
                <DialogContent>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 3, sm: 0 }} sx={{ mt: 1 }}>
                        {/* Copy Link */}
                        <Stack spacing={1} sx={{ flex: 1, alignItems: "center" }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    handleCopy().catch(() => {});
                                }}
                                startIcon={copyResult === "copied" ? <CheckIcon /> : <ContentCopyIcon />}
                            >
                                {copyResult === "copied" ? "Copied!" : copyResult === "failed" ? "Couldn't copy" : "Copy Link"}
                            </Button>
                            <VisuallyHidden role="status">
                                {copyResult === "copied" && "Link copied."}
                                {copyResult === "failed" && "Couldn't copy the link. Select the address to copy it."}
                            </VisuallyHidden>
                            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "bold", textAlign: "center", overflowWrap: "anywhere", userSelect: "text" }}>
                                {SHARE_URL}
                            </Typography>
                        </Stack>

                        {/* QR Code */}
                        <Stack spacing={1} sx={{ flex: 1, alignItems: "center" }}>
                            <Tooltip title="Enlarge QR code" arrow>
                                <ButtonBase onClick={() => setQrEnlarged(true)}>
                                    <Box
                                        component="img"
                                        src={QrSvg}
                                        alt="QR code"
                                        sx={{ display: "block", width: 120, height: 120 }}
                                    />
                                </ButtonBase>
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Scan to open
                            </Typography>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit" variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </BaseDialog>

            <Modal
                open={qrEnlarged}
                onClose={() => setQrEnlarged(false)}
            >
                <Box
                    role="dialog"
                    aria-modal="true"
                    aria-label="Enlarged QR code"
                    onClick={() => setQrEnlarged(false)}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        outline: "none"
                    }}
                >
                    <Box
                        component="img"
                        src={QrSvg}
                        alt="QR code enlarged"
                        sx={{ width: "min(474px, 90vw)", height: "min(474px, 90vw)" }}
                    />
                    <IconButton
                        aria-label="Close"
                        autoFocus
                        onClick={() => setQrEnlarged(false)}
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 44,
                            height: 44,
                            color: "common.white",
                            backgroundColor: "grey.900",
                            "&:hover": { backgroundColor: "grey.800" }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Modal>
        </>
    );
};
