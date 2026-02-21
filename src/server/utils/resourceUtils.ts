import path from "node:path";
import fs from "node:fs/promises";

export interface CachedFile {
    content: Buffer;
    contentType: string;
}

const staticCache = new Map<string, CachedFile>();

export const getMimeType = (extension: string): string => {
    switch (extension) {
        case ".html": return "text/html";
        case ".ico": return "image/x-icon";
        case ".png": return "image/png";
        case ".svg": return "image/svg+xml";
        case ".js": return "application/javascript";
        case ".css": return "text/css";
        case ".map": return "application/json";
        default:
            throw new Error(`Unsupported file type: ${extension}`);
    }
};

/**
 * Gets a file from cache or loads it from disk and caches it.
 * Returns the CachedFile or null if the file does not exist or is a directory.
 */
export const getCachedFile = async (basePath: string, relativePath: string): Promise<CachedFile | null> => {
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
