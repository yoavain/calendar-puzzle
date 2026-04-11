import React, { useState } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import { BaseDialog } from "./BaseDialog";
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
                setTimeout(() => {
                    handleClose();
                }, 2000);
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
        setTitle("");
        setType("bug");
        setDescription("");
        setError(null);
        setSuccess(false);
        onClose();
    };

    return (
        <BaseDialog
            open={open}
            onClose={handleClose}
            slotProps={{
                paper: { sx: { overflowX: "hidden" } }
            }}
        >
            <DialogTitle>Submit bug / Request Feature</DialogTitle>
            <DialogContent sx={{ overflowX: "hidden" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1, width: "100%", boxSizing: "border-box" }}>
                    {success && (
                        <Alert severity="success">
                            Thank you! Your feedback has been submitted successfully.
                        </Alert>
                    )}
                    {error && <Alert severity="error">{error}</Alert>}
                    
                    <TextField
                        label="Title"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={loading || success}
                        required
                        variant="outlined"
                        sx={{ "& .MuiInputBase-root": { userSelect: "text" } }}
                    />
                    
                    <TextField
                        select
                        label="Type"
                        value={type}
                        onChange={(e) => setType(e.target.value as IssueType)}
                        disabled={loading || success}
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
                        disabled={loading || success}
                        placeholder="Please provide details..."
                        variant="outlined"
                        slotProps={{ htmlInput: { maxLength: 1000 } }}
                        helperText={`${description.length}/1000`}
                        sx={{ "& .MuiInputBase-root": { userSelect: "text" } }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!title.trim() || loading || success}
                    startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                    {loading ? "Submitting..." : "Submit"}
                </Button>
            </DialogActions>
        </BaseDialog>
    );
};
