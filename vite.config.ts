import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "node:path";

const nodeModulesRe: RegExp = /node_modules\/(@[^/]+\/[^/]+|[^/]+)/;

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
        sourcemap: true,
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
            "/src": path.resolve(__dirname, "./src")
        }
    },
    worker: {
        format: "es"
    }
});
