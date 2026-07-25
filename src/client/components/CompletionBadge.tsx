import React, { useId } from "react";
import { useTheme } from "@mui/material/styles";
import { BADGE_VIEWBOX, buildBadgePalette, buildBadgeShapes } from "../utils/badgeGeometry";

interface CompletionBadgeProps {
    /** Rendered width and height in pixels. Below 24px a simplified form is drawn. */
    size: number;
    /** Omit for decorative use next to a label that already says it. */
    title?: string;
}

/**
 * Marks a player who has solved all 366 dates: a gold coin struck with the
 * puzzle board, two date cells left lit.
 */
export const CompletionBadge: React.FC<CompletionBadgeProps> = ({ size, title }) => {
    const theme = useTheme();
    const gradientId = useId();
    const palette = buildBadgePalette(theme.game.colors.medal.gold);
    const shapes = buildBadgeShapes(size);

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${BADGE_VIEWBOX} ${BADGE_VIEWBOX}`}
            role={title ? "img" : "presentation"}
            aria-label={title}
            aria-hidden={title ? undefined : true}
            focusable="false"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0.35" y2="1">
                    <stop offset="0" stopColor={palette.faceLight} />
                    <stop offset="0.42" stopColor={palette.faceMid} />
                    <stop offset="1" stopColor={palette.faceDeep} />
                </linearGradient>
            </defs>
            <circle
                cx={BADGE_VIEWBOX / 2}
                cy={BADGE_VIEWBOX / 2}
                r={BADGE_VIEWBOX / 2 - 1}
                fill={`url(#${gradientId})`}
            />
            {shapes.map((shape, index) => (
                <rect
                    key={index}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    rx={shape.radius}
                    fill={shape.tone === "lit" ? palette.lit : palette.engraved}
                />
            ))}
        </svg>
    );
};
