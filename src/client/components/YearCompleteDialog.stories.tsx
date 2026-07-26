import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { YearCompleteDialog } from "./YearCompleteDialog";
import { MOCK_USER_REGULAR } from "../storybook/MockUserProvider";

const meta: Meta<typeof YearCompleteDialog> = {
    title: "Dialogs/YearCompleteDialog",
    component: YearCompleteDialog,
    parameters: { layout: "fullscreen" }
};
export default meta;

type Story = StoryObj<typeof YearCompleteDialog>;

/** The greeting reads the signed-in user's name, so stories vary it. */
const userNamed = (name?: string) => ({
    userContext: { user: { ...MOCK_USER_REGULAR, name } }
});

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
    parameters: userNamed("Yoav Vainrich"),
    render: () => (
        <YearCompleteDialog
            isOpen={true}
            onPlayRandom={() => {}}
            onClose={() => {}}
        />
    )
};

/** Worst case for the greeting line — a long first name pushes it to wrap. */
export const LongFirstName: Story = {
    parameters: userNamed("Bartholomew Featherstonehaugh"),
    render: () => (
        <YearCompleteDialog
            isOpen={true}
            onPlayRandom={() => {}}
            onClose={() => {}}
        />
    )
};

/** `name` is optional on User, so the greeting has to stand without one. */
export const NoName: Story = {
    parameters: userNamed(undefined),
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
