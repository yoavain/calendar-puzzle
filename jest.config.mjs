/** @type {import("jest").Config} */
const config = {
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.(t|j)sx?$": [
            "@swc/jest", {
                jsc: {
                    parser: { syntax: "typescript", tsx: true },
                    target: "es2022"
                }
            }
        ]
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        // Strip .js extensions so the transform resolves TypeScript source files from ESM-style imports
        "^(\\.{1,2}/.+)\\.js$": "$1"
    },
    verbose: true,
    // @swc/jest does not instrument for Jest's default (babel/istanbul) coverage provider,
    // so coverage must be collected from V8's native counters instead.
    coverageProvider: "v8",
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
