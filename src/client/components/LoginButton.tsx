import React, { useState } from "react";
import Button from "@mui/material/Button";
import GoogleIcon from "@mui/icons-material/Google";
import { AUTH_GOOGLE } from "../../common/restPaths.js";
import { useIsEmbedded } from "../context/EmbeddedContext";
import { FullSiteDialog } from "./FullSiteDialog";

export const LoginButton: React.FC = () => {
    const isEmbedded = useIsEmbedded();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleClick = () => {
        if (isEmbedded) {
            setIsDialogOpen(true);
            return;
        }
        window.location.href = AUTH_GOOGLE;
    };

    return (
        <>
            <Button
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleClick}
                size="small"
                sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
                Sign in
            </Button>
            {isEmbedded && <FullSiteDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />}
        </>
    );
};
