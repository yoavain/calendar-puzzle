import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./test/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry"
    },
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000
    },
    projects: [
        {
            name: "desktop",
            use: { ...devices["Desktop Chrome"] }
        },
        {
            name: "mobile-portrait",
            use: {
                ...devices["Pixel 5"]
                // width 393, height 851, hasTouch: true
            }
        },
        {
            name: "mobile-landscape",
            use: {
                ...devices["Pixel 5 landscape"]
                // width 851, height 393, hasTouch: true
            }
        }
    ]
});
