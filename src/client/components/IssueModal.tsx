import React, { useEffect, useRef, useState } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import { BaseDialog } from "./BaseDialog";
import type { DialogProps } from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { submitIssue } from "../service/puzzleService.js";
import { logToServer } from "../service/logService.js";
import type { IssueType } from "../../common/restTypes.js";

const SUCCESS_CLOSE_DELAY_MS = 2000;

interface IssueModalProps {
    open: boolean;
    onClose: () => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({ open, onClose }) => {
    const [title, setTitle] = useState("");
    const [type, setType] = useState<IssueType>("bug");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const successCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelSuccessClose = () => {
        if (successCloseTimer.current !== null) {
            clearTimeout(successCloseTimer.current);
            successCloseTimer.current = null;
        }
    };

    useEffect(() => cancelSuccessClose, []);

    const handleSubmit = async () => {
        if (!title.trim()) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await submitIssue({
                title: title.trim(),
                description: description.trim(),
                type
            });

            if (result) {
                setSuccess(true);
                successCloseTimer.current = setTimeout(() => {
                    handleClose();
                }, SUCCESS_CLOSE_DELAY_MS);
            }
            else {
                setError("Failed to submit issue. Please try again.");
            }
        }
        catch (err) {
            logToServer("error", "IssueModal: Failed to submit issue", err);
            setError("An error occurred. Please try again later.");
        }
        finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Otherwise a pending close also shuts the dialog when it is opened again.
        cancelSuccessClose();
        setTitle("");
        setType("bug");
        setDescription("");
        setError(null);
        setSuccess(false);
        onClose();
    };

    const handleDialogClose: DialogProps["onClose"] = (_event, reason) => {
        // A send in progress has nothing safe to cancel. A stray backdrop tap must not lose typed text.
        const hasDraft = Boolean(title.trim() || description.trim());
        if (loading || (reason === "backdropClick" && hasDraft && !success)) {
            return;
        }
        handleClose();
    };

    return (
        <BaseDialog open={open} onClose={handleDialogClose}>
            <DialogTitle>Report a bug or request a feature</DialogTitle>
            <DialogContent>
                {success ? (
                    <Alert severity="success">
                        Thank you! Your feedback has been submitted successfully.
                    </Alert>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, width: "100%", boxSizing: "border-box" }}>
                        {error && <Alert severity="error">{error}</Alert>}
                    
                        <TextField
                            label="Title"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                            required
                            variant="outlined"
                            sx={{ "& .MuiInputBase-root": { userSelect: "text" } }}
                        />
                    
                        <TextField
                            select
                            label="Type"
                            value={type}
                            onChange={(e) => setType(e.target.value as IssueType)}
                            disabled={loading}
                            fullWidth
                            variant="outlined"
                            sx={{ "& .MuiInputBase-root": { userSelect: "text" } }}
                        >
                            <MenuItem value="bug">Bug</MenuItem>
                            <MenuItem value="enhancement">Feature Request</MenuItem>
                        </TextField>
                    
                        <TextField
                            label="Description"
                            multiline
                            rows={4}
                            fullWidth
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={loading}
                            placeholder="Please provide details..."
                            variant="outlined"
                            slotProps={{ htmlInput: { maxLength: 1000 } }}
                            helperText={`${description.length}/1000`}
                            sx={{ "& .MuiInputBase-root": { userSelect: "text" } }}
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {success ? (
                    <Button onClick={handleClose} color="inherit" variant="outlined" autoFocus>
                        Close
                    </Button>
                ) : (
                    <>
                        <Button onClick={handleClose} color="inherit" variant="outlined" disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                handleSubmit().catch(() => {});
                            }}
                            variant="contained"
                            disabled={!title.trim() || loading}
                            startIcon={loading && <CircularProgress size={20} color="inherit" />}
                        >
                            {loading ? "Submitting..." : "Submit"}
                        </Button>
                    </>
                )}
            </DialogActions>
        </BaseDialog>
    );
};
