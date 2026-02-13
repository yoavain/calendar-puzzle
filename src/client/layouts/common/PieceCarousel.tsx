import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import FlipIcon from "@mui/icons-material/Flip";

import { DraggablePiece } from "../../components/DraggablePiece";
import type { Piece as PieceType } from "../../../common/types";
import {
    CarouselContainer,
    CarouselViewport,
    CarouselTrack,
    CarouselSlide,
    PieceWrapper,
    ControlsWrapper,
    IndicatorContainer,
    IndicatorDot,
    type SlideState
} from "./PieceCarousel.styled";

/** Minimum number of slides embla-carousel needs for loop mode to work properly. */
const MIN_SLIDES_FOR_LOOP = 3;

interface PieceCarouselProps {
    /** Array of pieces to display (unplaced pieces only) */
    pieces: PieceType[];
    /** Currently selected piece ID */
    selectedPieceId: number | null;
    /** Handler when a piece is selected */
    onPieceSelect: (pieceId: number) => void;
    /** Handler for rotating a piece clockwise */
    onRotatePiece: (pieceId: number) => void;
    /** Handler for rotating a piece counter-clockwise */
    onRotateCCWPiece: (pieceId: number) => void;
    /** Handler for flipping a piece horizontally */
    onFlipHPiece: (pieceId: number) => void;
    /** Handler for flipping a piece vertically */
    onFlipVPiece: (pieceId: number) => void;
    /** Scroll axis: horizontal (default) or vertical */
    axis?: "x" | "y";
    /** When provided, pieces are rendered at this scale to match the board (carousel = drag = board size). */
    boardScale?: number;
}

interface SlideEntry {
    piece: PieceType;
    /** Index into the original pieces array */
    realIndex: number;
}

/**
 * Determine slide state based on position relative to active slide.
 * Used to hide non-adjacent slides during loop transitions.
 */
function getSlideState(index: number, activeIndex: number, totalSlides: number): SlideState {
    if (index === activeIndex) {
        return "active";
    }

    // Calculate distance considering loop wrap-around
    const distance = Math.min(
        Math.abs(index - activeIndex),
        Math.abs(index - activeIndex + totalSlides),
        Math.abs(index - activeIndex - totalSlides)
    );

    // Only show immediate neighbors (distance of 1)
    if (distance === 1) {
        return "adjacent";
    }

    return "hidden";
}

/**
 * Build the slides array, duplicating the full piece list when there are too few
 * for embla-carousel's loop mode to work.
 * Always duplicates whole copies so the rotation order stays consistent
 * (e.g. [A,B] → [A,B,A,B], never [A,B,A]).
 */
function buildSlides(pieces: PieceType[]): SlideEntry[] {
    const onePass = pieces.map((piece, i): SlideEntry => ({ piece, realIndex: i }));
    if (pieces.length >= MIN_SLIDES_FOR_LOOP) {
        return onePass;
    }
    // Repeat full copies until we reach the minimum
    const copies = Math.ceil(MIN_SLIDES_FOR_LOOP / pieces.length);
    const slides: SlideEntry[] = [];
    for (let c = 0; c < copies; c++) {
        slides.push(...onePass);
    }
    return slides;
}

/**
 * Carousel for displaying and selecting pieces (horizontal or vertical).
 * Uses embla-carousel for smooth, cyclic navigation.
 *
 * Features:
 * - Infinite loop scrolling
 * - Touch/swipe support (tap to select, tap on board to place)
 * - Shows current piece centered with controls
 * - Adjacent pieces are partially visible and dimmed
 * - Non-adjacent slides hidden to prevent loop animation glitches
 * - Indicator dots show position
 */
export const PieceCarousel: React.FC<PieceCarouselProps> = ({
    pieces,
    selectedPieceId,
    onPieceSelect,
    onRotatePiece,
    onRotateCCWPiece,
    onFlipHPiece,
    onFlipVPiece,
    axis = "x",
    boardScale
}) => {
    const theme = useTheme();
    const pieceCellSizePx =
        boardScale != null
            ? `${theme.game.cellSize * boardScale}px`
            : undefined;

    // Build slides array (may contain duplicates for small piece counts)
    const slides = useMemo(() => buildSlides(pieces), [pieces]);

    const singlePiece = pieces.length <= 1;
    const [emblaRef, emblaApi] = useEmblaCarousel({
        axis: axis === "y" ? "y" : "x",
        loop: !singlePiece,
        align: "center",
        containScroll: false,
        dragFree: false,
        skipSnaps: false,
        watchDrag: !singlePiece
    });

    const [activeIndex, setActiveIndex] = useState(0);

    // The real piece index corresponding to the active slide
    const activeRealIndex = slides[activeIndex]?.realIndex ?? 0;

    // Track previous pieces count to detect reset
    const prevPiecesCountRef = useRef(pieces.length);
    // Flag to prevent feedback loop when we're scrolling programmatically
    const isScrollingRef = useRef(false);

    // Update active index when carousel scrolls (user interaction)
    const onSelect = useCallback(() => {
        if (!emblaApi || isScrollingRef.current) {
            return;
        }
        const index = emblaApi.selectedScrollSnap();
        setActiveIndex(index);

        // Select the piece when it becomes active (only for user-initiated scrolls)
        const slide = slides[index];
        if (slide && slide.piece.id !== selectedPieceId) {
            onPieceSelect(slide.piece.id);
        }
    }, [emblaApi, slides, selectedPieceId, onPieceSelect]);

    // Subscribe to carousel events
    useEffect(() => {
        if (!emblaApi) {
            return;
        }

        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);

        return () => {
            emblaApi.off("select", onSelect);
            emblaApi.off("reInit", onSelect);
        };
    }, [emblaApi, onSelect]);

    // Handle pieces array changes (e.g., reset adds all pieces back)
    useEffect(() => {
        if (!emblaApi) {
            return;
        }

        const prevCount = prevPiecesCountRef.current;
        const currentCount = pieces.length;
        prevPiecesCountRef.current = currentCount;

        // If pieces count increased significantly (like a reset), reinitialize
        if (currentCount > prevCount + 1) {
            // Reset to first slide after reInit
            emblaApi.reInit();
            // Use setTimeout to ensure reInit is complete before scrolling
            setTimeout(() => {
                isScrollingRef.current = true;
                emblaApi.scrollTo(0, true); // Jump instantly, no animation
                setActiveIndex(0);
                if (pieces[0]) {
                    onPieceSelect(pieces[0].id);
                }
                isScrollingRef.current = false;
            }, 0);
        }
    }, [emblaApi, pieces, onPieceSelect]);

    // Scroll to selected piece when selection changes externally
    useEffect(() => {
        if (!emblaApi || isScrollingRef.current) {
            return;
        }

        const selectedRealIndex = pieces.findIndex(p => p.id === selectedPieceId);
        if (selectedRealIndex >= 0 && selectedRealIndex !== activeRealIndex) {
            // Find the first slide matching this real index
            const slideIndex = slides.findIndex(s => s.realIndex === selectedRealIndex);
            if (slideIndex >= 0) {
                isScrollingRef.current = true;
                emblaApi.scrollTo(slideIndex);
                setActiveIndex(slideIndex);
                // Reset flag after scroll animation would complete
                setTimeout(() => {
                    isScrollingRef.current = false;
                }, 300);
            }
        }
    }, [emblaApi, selectedPieceId, pieces, slides, activeRealIndex]);

    // Handle indicator dot click - scroll to first slide matching that real index
    const scrollToIndex = useCallback((realIndex: number) => {
        if (emblaApi) {
            const slideIndex = slides.findIndex(s => s.realIndex === realIndex);
            if (slideIndex >= 0) {
                emblaApi.scrollTo(slideIndex);
            }
        }
    }, [emblaApi, slides]);

    if (pieces.length === 0) {
        return (
            <CarouselContainer axis={axis}>
                {/* Empty state - all pieces placed */}
            </CarouselContainer>
        );
    }

    return (
        <CarouselContainer axis={axis}>
            <CarouselViewport ref={emblaRef} axis={axis} aria-roledescription="carousel">
                <CarouselTrack axis={axis} role="list">
                    {slides.map(({ piece, realIndex }, index) => {
                        const slideState = getSlideState(index, activeIndex, slides.length);
                        const isActive = index === activeIndex;
                        return (
                            <CarouselSlide key={`${piece.id}-${index}`} slideState={slideState} axis={axis} role="listitem" aria-selected={isActive}>
                                <PieceWrapper>
                                    <DraggablePiece
                                        piece={piece}
                                        isSelected={piece.id === selectedPieceId}
                                        onClick={() => onPieceSelect(piece.id)}
                                        hideSelectionBorder
                                        cellSizePx={pieceCellSizePx}
                                    />
                                </PieceWrapper>

                                <ControlsWrapper>
                                    <IconButton
                                        size="large"
                                        onClick={() => onRotatePiece(piece.id)}
                                        aria-label="Rotate clockwise"
                                        sx={{
                                            border: 1,
                                            borderColor: "divider",
                                            bgcolor: "background.paper"
                                        }}
                                    >
                                        <RotateRightIcon />
                                    </IconButton>
                                    <IconButton
                                        size="large"
                                        onClick={() => onRotateCCWPiece(piece.id)}
                                        aria-label="Rotate counter-clockwise"
                                        sx={{
                                            border: 1,
                                            borderColor: "divider",
                                            bgcolor: "background.paper"
                                        }}
                                    >
                                        <RotateLeftIcon />
                                    </IconButton>
                                    <IconButton
                                        size="large"
                                        onClick={() => onFlipHPiece(piece.id)}
                                        aria-label="Flip horizontal"
                                        sx={{
                                            border: 1,
                                            borderColor: "divider",
                                            bgcolor: "background.paper"
                                        }}
                                    >
                                        <FlipIcon />
                                    </IconButton>
                                    <IconButton
                                        size="large"
                                        onClick={() => onFlipVPiece(piece.id)}
                                        aria-label="Flip vertical"
                                        sx={{
                                            border: 1,
                                            borderColor: "divider",
                                            bgcolor: "background.paper",
                                            transform: "rotate(90deg)"
                                        }}
                                    >
                                        <FlipIcon />
                                    </IconButton>
                                </ControlsWrapper>
                            </CarouselSlide>
                        );
                    })}
                </CarouselTrack>
            </CarouselViewport>

            {/* Position indicator dots - one per real piece, not per slide */}
            <IndicatorContainer axis={axis} role="tablist" aria-label="Pieces">
                {pieces.map((piece, index) => (
                    <IndicatorDot
                        key={piece.id}
                        isActive={index === activeRealIndex}
                        onClick={() => scrollToIndex(index)}
                        role="tab"
                        aria-label={`Piece ${index + 1} of ${pieces.length}`}
                        aria-selected={index === activeRealIndex}
                        tabIndex={0}
                        onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                                scrollToIndex(index);
                            }
                        }}
                    />
                ))}
            </IndicatorContainer>
        </CarouselContainer>
    );
};
