import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "node:path";

const nodeModulesRe: RegExp = /node_modules\/(@[^/]+\/[^/]+|[^/]+)/;

const vendorPackages: Set<string> = new Set<string>([
    "react",
    "react-dom",
    "react-router-dom",
    "embla-carousel-react",
    "@mui/material",
    "@mui/icons-material",
    "@emotion/react",
    "@emotion/styled",
    "@dnd-kit/core",
    "@dnd-kit/utilities"
]);

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
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Extract package name from node_modules path, handling scoped packages (@scope/name)
                    const match = id.match(nodeModulesRe);
                    if (match && vendorPackages.has(match[1])) {
                        return "vendor";
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
