import React from "react";
import type { Preview, Decorator } from "@storybook/react";
import { StoryThemeProvider } from "../src/client/storybook/StoryThemeProvider";
import { MockUserProvider, MOCK_USER_REGULAR } from "../src/client/storybook/MockUserProvider";

const withProviders: Decorator = (Story, context) => {
    const mode = context.globals["theme"] === "light" ? "light" : "dark";
    const {
        user = MOCK_USER_REGULAR,
        completedDates = [],
        playedDates = [],
        loading = false
    } = context.parameters["userContext"] ?? {};
    return (
        <MockUserProvider user={user} completedDates={completedDates} playedDates={playedDates} loading={loading}>
            <StoryThemeProvider mode={mode}>
                <Story />
            </StoryThemeProvider>
        </MockUserProvider>
    );
};

const preview: Preview = {
    decorators: [withProviders],
    globalTypes: {
        theme: {
            name: "Theme",
            defaultValue: "dark",
            toolbar: {
                icon: "circlehollow",
                items: [
                    { value: "light", icon: "sun", title: "Light" },
                    { value: "dark", icon: "moon", title: "Dark" }
                ],
                dynamicTitle: true
            }
        }
    },
    parameters: {
        backgrounds: { disable: true },
        actions: { argTypesRegex: "^on[A-Z].*" },
        layout: "centered"
    }
};
export default preview;
