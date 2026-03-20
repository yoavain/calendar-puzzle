import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { calculateBoardScale } from "./boardScale";

/**
 * Computes and tracks the board scale factor, re-calculating on resize and
 * orientation change. The caller supplies functions that derive the available
 * width and height from the current window dimensions.
 */
export function useBoardScale(
    getWidth: (windowWidth: number) => number,
    getHeight: (windowHeight: number) => number
): number {
    const theme = useTheme();
    const [boardScale, setBoardScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            const scale = calculateBoardScale(
                getWidth(window.innerWidth),
                getHeight(window.innerHeight),
                theme.game.cellSize
            );
            setBoardScale(scale);
        };

        updateScale();
        window.addEventListener("resize", updateScale);
        window.addEventListener("orientationchange", updateScale);

        return () => {
            window.removeEventListener("resize", updateScale);
            window.removeEventListener("orientationchange", updateScale);
        };
    }, [getWidth, getHeight, theme.game.cellSize]);

    return boardScale;
}
