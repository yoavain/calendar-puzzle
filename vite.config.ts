import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "node:path";

const nodeModulesRe: RegExp = /node_modules\/(@[^/]+\/[^/]+|[^/]+)/;

// Keep these packages in two stable chunks. Do not remove the "vendor" entries to split MUI by route.
// Measured on 2026-11-11 with the lazy dialogs in place. Without the "vendor" entries, only 44 KB raw of
// MUI left the first load, and FCP did not change. The app chunk grew from 166 KB to 346 KB raw and
// changed on every deploy, so a returning visitor downloaded the MUI code again.
const vendorPackagesChunk: Record<string, string> = {
    "react": "react",
    "react-dom": "react",
    "react-router-dom": "react",
    "embla-carousel-react": "vendor",
    "@mui/material": "vendor",
    "@mui/icons-material": "vendor",
    "@emotion/react": "vendor",
    "@emotion/styled": "vendor",
    "@dnd-kit/core": "vendor",
    "@dnd-kit/utilities": "vendor"
};

export default defineConfig({
    plugins: [
        react(),
        ...(process.env.VISUALIZE === "true" ? [visualizer({ open: true, gzipSize: true })] : [])
    ],
    root: "public",
    publicDir: false,
    base: "/client/",
    build: {
        outDir: "../build",
        emptyOutDir: true,
        sourcemap: process.env.NODE_ENV !== "production",
        chunkSizeWarningLimit: 500,
        rolldownOptions: {
            output: {
                manualChunks(id) {
                    // Extract package name from node_modules path, handling scoped packages (@scope/name)
                    const match = id.match(nodeModulesRe);
                    if (match) {
                        return vendorPackagesChunk[match[1]];
                    }
                }
            }
        }
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            // Proxy API requests to the backend server during development
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true
            }
        }
    },
    resolve: {
        alias: {
            "/src": path.resolve(import.meta.dirname, "./src")
        }
    },
    worker: {
        format: "es"
    }
});
