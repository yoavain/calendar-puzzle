import React from "react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme } from "../theme";
import { StaticBoard } from "../components/landing/StaticBoard";
import { StaticPieces } from "../components/landing/StaticPieces";
import {
    LandingContainer,
    TitleSection,
    PerspectiveContainer,
    TiltedContent,
    BoardWrapper,
    PiecesRow
} from "./LandingPage.styled";
import calendarImg from "../assets/CALENDAR.png";
import puzzleImg from "../assets/PUZZLE.png";

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        void navigate("/play");
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <LandingContainer onClick={handleClick}>
                <PerspectiveContainer>
                    <TiltedContent>
                        <TitleSection>
                            <img src={calendarImg} alt="Calendar" />
                            <img src={puzzleImg} alt="Puzzle" />
                        </TitleSection>

                        <BoardWrapper>
                            <StaticBoard />
                        </BoardWrapper>

                        <PiecesRow>
                            <StaticPieces />
                        </PiecesRow>
                    </TiltedContent>
                </PerspectiveContainer>
            </LandingContainer>
        </ThemeProvider>
    );
};
