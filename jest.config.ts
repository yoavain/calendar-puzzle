import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        // Strip .js extensions so ts-jest resolves TypeScript source files from ESM-style imports
        "^(\\.{1,2}/.+)\\.js$": "$1",
    },
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.stories.{ts,tsx}"],
    coverageDirectory: "coverage",
    coverageReporters: [
        "text",
        "text-summary",
        "json",
        "lcov",
        "clover"
    ],
    coverageThreshold: {
        global: {
            lines: 30
        }
    }
};

export default config; 