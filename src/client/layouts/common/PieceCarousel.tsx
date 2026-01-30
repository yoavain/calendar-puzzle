import React, { useCallback, useEffect, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
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
 * Horizontal carousel for displaying and selecting pieces.
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
    onFlipVPiece
}) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true, // Enable infinite loop
        align: "center",
        containScroll: false, // Required for loop to work properly
        dragFree: false,
        skipSnaps: false
    });

    const [activeIndex, setActiveIndex] = useState(0);
    
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
        const piece = pieces[index];
        if (piece && piece.id !== selectedPieceId) {
            onPieceSelect(piece.id);
        }
    }, [emblaApi, pieces, selectedPieceId, onPieceSelect]);

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
        
        const selectedIndex = pieces.findIndex(p => p.id === selectedPieceId);
        if (selectedIndex >= 0 && selectedIndex !== activeIndex) {
            isScrollingRef.current = true;
            emblaApi.scrollTo(selectedIndex);
            setActiveIndex(selectedIndex);
            // Reset flag after scroll animation would complete
            setTimeout(() => {
                isScrollingRef.current = false;
            }, 300);
        }
    }, [emblaApi, selectedPieceId, pieces, activeIndex]);

    // Handle indicator dot click
    const scrollToIndex = useCallback((index: number) => {
        if (emblaApi) {
            emblaApi.scrollTo(index);
        }
    }, [emblaApi]);

    if (pieces.length === 0) {
        return (
            <CarouselContainer>
                {/* Empty state - all pieces placed */}
            </CarouselContainer>
        );
    }

    return (
        <CarouselContainer>
            <CarouselViewport ref={emblaRef}>
                <CarouselTrack>
                    {pieces.map((piece, index) => {
                        const slideState = getSlideState(index, activeIndex, pieces.length);
                        
                        return (
                            <CarouselSlide key={piece.id} slideState={slideState}>
                                <PieceWrapper>
                                    <DraggablePiece
                                        piece={piece}
                                        isSelected={piece.id === selectedPieceId}
                                        onClick={() => onPieceSelect(piece.id)}
                                        hideSelectionBorder
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

            {/* Position indicator dots */}
            <IndicatorContainer>
                {pieces.map((piece, index) => (
                    <IndicatorDot 
                        key={piece.id} 
                        isActive={index === activeIndex}
                        onClick={() => scrollToIndex(index)}
                    />
                ))}
            </IndicatorContainer>
        </CarouselContainer>
    );
};
