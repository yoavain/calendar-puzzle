import React, { useEffect, useState } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { BaseDialog } from "./BaseDialog";
import { SHARE_URL } from "../../common/consts";
import QrSvgRaw from "../assets/QR.svg?raw";

const QrSvg = `data:image/svg+xml;utf8,${encodeURIComponent(QrSvgRaw)}`;

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ open, onClose }) => {
    const [copied, setCopied] = useState(false);
    const [qrEnlarged, setQrEnlarged] = useState(false);

    useEffect(() => {
        if (!open) {
            setCopied(false);
            setQrEnlarged(false);
        }
    }, [open]);

    const handleCopy = () => {
        navigator.clipboard.writeText(SHARE_URL).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <BaseDialog
                open={open}
                onClose={onClose}
                slotProps={{
                    paper: { sx: (theme) => ({ borderRadius: `${theme.game.radius.md}px`, minWidth: 420 }) }
                }}
            >
                <DialogTitle sx={{ m: 0, p: 2, textAlign: "center", fontWeight: "bold" }}>
                    Share
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500]
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack direction="row" sx={{ mt: 1 }}>
                        {/* Copy Link */}
                        <Stack spacing={1} sx={{ flex: 1, alignItems: "center" }}>
                            <Button
                                variant="outlined"
                                onClick={handleCopy}
                                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                            >
                                {copied ? "Copied!" : "Copy Link"}
                            </Button>
                            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "bold", whiteSpace: "nowrap", textAlign: "center" }}>
                                {SHARE_URL}
                            </Typography>
                        </Stack>

                        {/* QR Code */}
                        <Stack spacing={1} sx={{ flex: 1, alignItems: "center" }}>
                            <Tooltip title="Click to enlarge" arrow>
                                <Box
                                    component="img"
                                    src={QrSvg}
                                    alt="QR code"
                                    onClick={() => setQrEnlarged(true)}
                                    sx={{ width: 120, height: 120, cursor: "pointer" }}
                                />
                            </Tooltip>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Scan to open
                            </Typography>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button onClick={onClose} variant="contained" fullWidth sx={{ mx: 2 }}>
                        Close
                    </Button>
                </DialogActions>
            </BaseDialog>

            <Modal
                open={qrEnlarged}
                onClose={() => setQrEnlarged(false)}
                disableAutoFocus
            >
                <Box
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
                </Box>
            </Modal>
        </>
    );
};
