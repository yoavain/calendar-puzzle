import path from "node:path";
import fs from "node:fs/promises";
import type { FastifyBaseLogger } from "fastify";

export interface CachedFile {
    content: Buffer;
    contentType: string;
}

const staticCache = new Map<string, CachedFile>();

export const getMimeType = (extension: string): string | null => {
    switch (extension) {
        case ".html": return "text/html";
        case ".ico": return "image/x-icon";
        case ".png": return "image/png";
        case ".svg": return "image/svg+xml";
        case ".webp": return "image/webp";
        case ".js": return "application/javascript";
        case ".css": return "text/css";
        case ".json": return "application/json";
        case ".map": return "application/json";
        case ".woff": return "font/woff";
        case ".woff2": return "font/woff2";
        default:
            return null;
    }
};

/**
 * Gets a file from cache or loads it from disk and caches it.
 * Returns the CachedFile or null if the file does not exist or is a directory.
 */
export const getCachedFile = async (basePath: string, relativePath: string, log?: FastifyBaseLogger): Promise<CachedFile | null> => {
    const normalizedPath = relativePath.replace(/\\/g, "/");
    const cached = staticCache.get(normalizedPath);
    if (cached) {
        return cached;
    }

    const fullPath = path.resolve(basePath, normalizedPath);

    // Safety check: ensure the resolved path is within the base directory
    if (!fullPath.startsWith(basePath + path.sep) && fullPath !== basePath) {
        return null;
    }

    try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            return null;
        }

        const extension = path.extname(fullPath).toLowerCase();
        const contentType = getMimeType(extension);
        if (contentType === null) {
            log?.warn({ extension, path: normalizedPath }, "Unsupported file type — refusing to serve");
            return null;
        }
        const content = await fs.readFile(fullPath);
        const cachedFile = { content, contentType };
        staticCache.set(normalizedPath, cachedFile);
        return cachedFile;
    }
    catch {
        return null;
    }
};

/**
 * Validates a path to prevent path traversal attacks.
 * Returns the resolved path if valid, or null if the path attempts traversal.
 */
export const validatePath = (basePath: string, requestedPath: string): string | null => {
    // Normalize and resolve the full path
    const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.resolve(basePath, normalizedPath);
    
    // Ensure the resolved path is within the base directory
    if (!fullPath.startsWith(basePath + path.sep) && fullPath !== basePath) {
        return null;
    }
    
    return fullPath;
};
