import React from "react";
import Button from "@mui/material/Button";
import GoogleIcon from "@mui/icons-material/Google";
import { AUTH_GOOGLE } from "../../common/restPaths.js";

export const LoginButton: React.FC = () => {
    const handleLogin = () => {
        window.location.href = AUTH_GOOGLE;
    };

    return (
        <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleLogin}
            size="small"
        >
            Sign in
        </Button>
    );
};
