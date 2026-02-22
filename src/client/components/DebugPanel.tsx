import React, { useEffect, useState } from "react";
import { debugLogger } from "../utils/debugLogger";
import { useUser } from "../context/UserContext";

/**
 * Floating debug panel — admin-only, visible when debug logging is enabled.
 *
 * Provides:
 * - Live entry count
 * - "Dump Log" button to download the circular buffer as JSON
 * - "Clear" button to reset the buffer
 */
export const DebugPanel: React.FC = () => {
    const { user } = useUser();
    const [enabled, setEnabled] = useState(debugLogger.isEnabled());
    const [count, setCount] = useState(0);

    // React to enable/disable events from the admin toggle
    useEffect(() => {
        const handler = () => setEnabled(debugLogger.isEnabled());
        window.addEventListener("debug:mode-changed", handler);
        return () => window.removeEventListener("debug:mode-changed", handler);
    }, []);

    // Refresh count every second so the display stays current
    useEffect(() => {
        if (!enabled) {
            return;
        }
        const id = window.setInterval(() => {
            setCount(debugLogger.count());
        }, 1000);
        return () => window.clearInterval(id);
    }, [enabled]);

    if (!user?.isAdmin || !enabled) {
        return null;
    }

    return (
        <div
            style={{
                position: "fixed",
                bottom: 8,
                left: 8,
                zIndex: 99999,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "6px 10px",
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "monospace",
                pointerEvents: "auto",
                userSelect: "none"
            }}
        >
            <span>debug: {count} entries</span>
            <div style={{ display: "flex", gap: 4 }}>
                <button
                    onClick={() => debugLogger.download()}
                    style={{
                        cursor: "pointer",
                        padding: "2px 8px",
                        background: "#1976d2",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12
                    }}
                >
                    Dump Log
                </button>
                <button
                    onClick={() => {
                        debugLogger.clear(); setCount(0); 
                    }}
                    style={{
                        cursor: "pointer",
                        padding: "2px 8px",
                        background: "#555",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12
                    }}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};
