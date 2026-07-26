import React, { useCallback, useMemo, useState } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import { BaseDialog } from "./BaseDialog";
import { CompletionBadge } from "./CompletionBadge";
import { useUser } from "../context/UserContext";
import { DAYS_IN_MONTH, MONTHS, TOTAL_DATES } from "../../common/consts";
import { getMosaicColor } from "../utils/pieceColors";
import { prefersReducedMotion } from "../utils/motion";
import { canShareImage, renderYearImage, saveYearImage, shareYearImage } from "../utils/yearImage";
import { logToServer } from "../service/logService";
import {
    BadgeSlot,
    CelebrationStack,
    CompletionCount,
    CompletionTitle,
    MonthLabels,
    MosaicCell,
    MosaicGrid,
    MosaicWrapper
} from "./YearCompleteDialog.styled";

/** Per-cell stagger for the ignition sweep, in ms. */
const CELL_STAGGER_MS = 6;

/** Badge drops in as the sweep is finishing. */
const BADGE_DELAY_MS = 2500;

const BADGE_SIZE = 76;

/** How long a "Copied!" / "Saved!" confirmation stays on the button. */
const CONFIRMATION_MS = 2000;

interface YearCompleteDialogProps {
    isOpen: boolean;
    onPlayRandom: () => void;
    onClose: () => void;
}

interface MosaicDay {
    month: number;
    day: number;
    order: number;
}

/** Every date of the year, in the order the sweep lights them. */
const buildMosaicDays = (): MosaicDay[] => {
    const days: MosaicDay[] = [];
    for (let month = 0; month < MONTHS.length; month++) {
        for (let day = 1; day <= DAYS_IN_MONTH[month]; day++) {
            days.push({ month, day, order: days.length });
        }
    }
    return days;
};

/**
 * Shown to a player who has solved all 366 dates, in place of the
 * "play another?" prompt — there is no other date left to suggest.
 */
export const YearCompleteDialog: React.FC<YearCompleteDialogProps> = ({
    isOpen,
    onPlayRandom,
    onClose
}) => {
    const theme = useTheme();
    const { user } = useUser();
    const [confirmation, setConfirmation] = useState<"saved" | "shared" | null>(null);
    const [exportError, setExportError] = useState(false);

    // `name` is optional on User (session PII only) and holds a full name, so
    // the greeting takes the first word and falls back to a bare
    // "Congratulations!", which stands on its own as a first line.
    const firstName = user?.name?.trim().split(/\s+/)[0];
    const greeting = firstName ? `Congratulations, ${firstName}!` : "Congratulations!";

    const days = useMemo(buildMosaicDays, []);
    const animate = !prefersReducedMotion();
    const shareToSheet = canShareImage();

    const withRenderedCanvas = useCallback(async (
        deliver: (canvas: HTMLCanvasElement) => Promise<unknown>,
        confirm: "saved" | "shared"
    ) => {
        setExportError(false);
        try {
            const canvas = document.createElement("canvas");
            renderYearImage(canvas, theme.game.colors.medal.gold);
            await deliver(canvas);
            setConfirmation(confirm);
            window.setTimeout(() => setConfirmation(null), CONFIRMATION_MS);
        }
        catch (error) {
            // A cancelled share sheet rejects too — not worth alarming anyone over.
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }
            setExportError(true);
            logToServer("error", "YearComplete: Failed to export image", error);
        }
    }, [theme]);

    const handleSave = useCallback(
        () => withRenderedCanvas(saveYearImage, "saved"),
        [withRenderedCanvas]
    );

    const handleShare = useCallback(
        () => withRenderedCanvas(shareYearImage, "shared"),
        [withRenderedCanvas]
    );

    const shareLabel = shareToSheet ? "Share" : "Copy image";
    const shareConfirmedLabel = shareToSheet ? "Shared!" : "Copied!";

    return (
        <BaseDialog
            open={isOpen}
            onClose={onClose}
            aria-labelledby="year-complete-title"
            slotProps={{
                paper: {
                    sx: (t) => ({
                        borderRadius: `${t.game.radius.md}px`,
                        // Wider than BaseDialog's fixed `sm`: 31 mosaic columns
                        // need the room, and BaseDialog pins maxWidth after the
                        // prop spread so it can't be overridden from outside.
                        maxWidth: 760,
                        [t.breakpoints.down("sm")]: { margin: 2 }
                    })
                }
            }}
        >
            <DialogContent>
                <CelebrationStack>
                    <MosaicWrapper>
                        <MonthLabels aria-hidden="true">
                            {MONTHS.map(month => (
                                <span key={month}>{month.toUpperCase()}</span>
                            ))}
                        </MonthLabels>
                        <MosaicGrid
                            role="img"
                            aria-label={`All ${TOTAL_DATES} calendar dates solved`}
                        >
                            {days.map(({ month, day, order }) => (
                                <MosaicCell
                                    key={`${month}-${day}`}
                                    style={{ gridRow: month + 1, gridColumn: day }}
                                    cellColor={getMosaicColor(month)}
                                    delayMs={order * CELL_STAGGER_MS}
                                    animate={animate}
                                />
                            ))}
                        </MosaicGrid>
                    </MosaicWrapper>

                    <BadgeSlot animate={animate} delayMs={BADGE_DELAY_MS}>
                        <CompletionBadge size={BADGE_SIZE} />
                    </BadgeSlot>

                    <Box sx={{ textAlign: "center" }}>
                        <CompletionCount>{`${TOTAL_DATES} / ${TOTAL_DATES}`}</CompletionCount>
                        <CompletionTitle id="year-complete-title" sx={{ mt: 1 }}>
                            {greeting}
                            <br />
                            Every date on the calendar.
                        </CompletionTitle>
                        {exportError && (
                            <Typography variant="body2" role="alert" sx={{ mt: 1, color: "error.main" }}>
                                Couldn&apos;t create the image. Please try again.
                            </Typography>
                        )}
                    </Box>
                </CelebrationStack>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", flexWrap: "wrap", gap: 1, pb: 2 }}>
                <Button
                    onClick={handleSave}
                    color="inherit"
                    variant="outlined"
                    startIcon={confirmation === "saved" ? <CheckIcon /> : <DownloadIcon />}
                >
                    {confirmation === "saved" ? "Saved!" : "Save as image"}
                </Button>
                <Button
                    onClick={handleShare}
                    color="inherit"
                    variant="outlined"
                    startIcon={
                        confirmation === "shared"
                            ? <CheckIcon />
                            : shareToSheet ? <ShareIcon /> : <ContentCopyIcon />
                    }
                >
                    {confirmation === "shared" ? shareConfirmedLabel : shareLabel}
                </Button>
                <Button
                    onClick={onPlayRandom}
                    color="primary"
                    variant="contained"
                    startIcon={<CasinoIcon />}
                    autoFocus
                >
                    Play a random date
                </Button>
            </DialogActions>
        </BaseDialog>
    );
};
