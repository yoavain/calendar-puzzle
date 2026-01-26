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
    verbose: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: [
        "text",
        "text-summary",
        "json",
        "lcov",
        "clover"
    ]
};

export default config; 