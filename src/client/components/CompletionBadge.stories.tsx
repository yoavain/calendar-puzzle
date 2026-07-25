import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CompletionBadge } from "./CompletionBadge";
import { BADGE_SMALL_FORM_MAX_SIZE } from "../utils/badgeGeometry";

const meta: Meta<typeof CompletionBadge> = {
    title: "Components/CompletionBadge",
    component: CompletionBadge
};
export default meta;

type Story = StoryObj<typeof CompletionBadge>;

const Specimen: React.FC<{ size: number; caption: string }> = ({ size, caption }) => (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <Box sx={{ display: "grid", placeItems: "center", minWidth: 88, minHeight: 88 }}>
            <CompletionBadge size={size} />
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center" }}>
            {size}px<br />{caption}
        </Typography>
    </Box>
);

/** The three sizes the badge actually ships at. */
export const Sizes: Story = {
    render: () => (
        <Box sx={{ display: "flex", gap: 4, alignItems: "flex-end", p: 3 }}>
            <Specimen size={76} caption="celebration screen" />
            <Specimen size={32} caption="hall of fame" />
            <Specimen size={19} caption="avatar" />
        </Box>
    )
};

/**
 * Below 24px the full 7x7 grid stops resolving, so a simplified form is drawn.
 * Both are shown enlarged here to compare the geometry.
 */
export const SmallFormComparison: Story = {
    render: () => (
        <Box sx={{ display: "flex", gap: 4, alignItems: "flex-end", p: 3 }}>
            <Specimen size={BADGE_SMALL_FORM_MAX_SIZE} caption="full board (threshold)" />
            <Specimen size={BADGE_SMALL_FORM_MAX_SIZE - 1} caption="simplified form" />
        </Box>
    )
};
