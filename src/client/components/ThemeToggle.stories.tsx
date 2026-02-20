import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import ThemeToggle from "./ThemeToggle";
import { ColorModeContext } from "../theme/ColorModeContext";
import { darkTheme, lightTheme } from "../theme/theme";

const meta: Meta<typeof ThemeToggle> = {
    title: "UI/ThemeToggle",
    component: ThemeToggle,
    parameters: { layout: "centered" }
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

const DefaultStory = (): React.JSX.Element => {
    const [mode, setMode] = useState<"light" | "dark">("dark");
    return (
        <ColorModeContext.Provider value={{
            mode,
            effectiveMode: mode,
            toggleColorMode: () => setMode(m => m === "dark" ? "light" : "dark"),
            setMode: (m) => setMode(m === "system" ? "dark" : m)
        }}>
            <MuiThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
                <ThemeToggle />
            </MuiThemeProvider>
        </ColorModeContext.Provider>
    );
};

export const Default: Story = {
    render: DefaultStory
};
