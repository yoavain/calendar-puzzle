import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
    stories: ["../src/client/**/*.stories.@(ts|tsx)"],
    addons: [],
    framework: { name: "@storybook/react-vite", options: {} },
    viteFinal: async (config) => mergeConfig(config, {
        // Don't inherit root:"public" from vite.config.ts — Storybook needs project root
        root: undefined,
        resolve: {
            alias: { "/src": path.resolve(__dirname, "../src") }
        }
    })
};
export default config;
