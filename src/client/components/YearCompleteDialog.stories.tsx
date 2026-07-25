import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { YearCompleteDialog } from "./YearCompleteDialog";

const meta: Meta<typeof YearCompleteDialog> = {
    title: "Dialogs/YearCompleteDialog",
    component: YearCompleteDialog,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof YearCompleteDialog>;

/**
 * Forces the reduced-motion media query on for the duration of a story, so the
 * skip-to-final-state path can be reviewed without changing an OS setting.
 */
const forceReducedMotion = () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => (
        query.includes("prefers-reduced-motion")
            ? { ...original(query), matches: true }
            : original(query)
    ) as MediaQueryList;
    return () => {
        window.matchMedia = original;
    };
};

/**
 * The state a player reaches after solving all 366 dates — otherwise only
 * visible after a year of play. The mosaic ignites Jan 1 -> Dec 31 over ~2.4s,
 * then the badge lands.
 */
export const Default: Story = {
    render: () => (
        <YearCompleteDialog
            isOpen={true}
            onPlayRandom={() => {}}
            onClose={() => {}}
        />
    )
};

/** Mosaic and badge render in their final state, with no animation at all. */
export const ReducedMotion: Story = {
    beforeEach: forceReducedMotion,
    render: () => (
        <YearCompleteDialog
            isOpen={true}
            onPlayRandom={() => {}}
            onClose={() => {}}
        />
    )
};
