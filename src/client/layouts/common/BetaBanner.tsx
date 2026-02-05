import React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

import { useLayoutContext } from "../LayoutContext";

/**
 * Compact wrapper for the mobile disclaimer.
 * Keeps flex layout stable and uses minimal vertical space.
 * minWidth: 0 allows text to wrap in narrow columns (e.g. landscape toolbar).
 */
const BannerWrapper = styled(Box)({
    flexShrink: 0,
    minWidth: 0
});

/**
 * Shared disclaimer for mobile layouts.
 * Landscape: "Mobile layout (Alpha)". Portrait: "Mobile layout (Beta)".
 */
export const BetaBanner: React.FC = () => {
    const { layout } = useLayoutContext();
    const label = layout === "mobile-landscape" ? "Alpha" : "Beta";
    return (
        <BannerWrapper sx={{ px: 1 }}>
            <Alert
                severity="info"
                role="status"
                aria-live="polite"
                sx={{
                    py: 0.5,
                    px: 1.5,
                    "& .MuiAlert-message": {
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                        minWidth: 0
                    }
                }}
            >
                Mobile layout ({label})
            </Alert>
        </BannerWrapper>
    );
};
