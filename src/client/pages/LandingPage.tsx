import React from "react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme } from "../theme/theme";
import { StaticBoard } from "../components/landing/StaticBoard";
import { StaticPieces } from "../components/landing/StaticPieces";
import {
    LandingContainer,
    TitleSection,
    SceneContainer,
    TiltedScene,
    BoardCenter,
    BoardDepth
} from "./LandingPage.styled";
import calendarImg from "../assets/CALENDAR.png";
import puzzleImg from "../assets/PUZZLE.png";

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        void navigate("/");
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <LandingContainer onClick={handleClick}>
                <TitleSection>
                    <img src={calendarImg} alt="Calendar" />
                    <img src={puzzleImg} alt="Puzzle" />
                </TitleSection>

                <SceneContainer>
                    <TiltedScene>
                        <BoardCenter>
                            <BoardDepth>
                                <StaticBoard />
                            </BoardDepth>
                        </BoardCenter>
                        <StaticPieces />
                    </TiltedScene>
                </SceneContainer>
            </LandingContainer>
        </ThemeProvider>
    );
};
