import React from "react";
import Button from "@mui/material/Button";
import GoogleIcon from "@mui/icons-material/Google";

export const LoginButton: React.FC = () => {
    const handleLogin = () => {
        window.location.href = "/auth/google";
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
