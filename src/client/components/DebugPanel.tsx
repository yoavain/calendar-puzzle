import React, { useEffect, useState } from "react";
import { debugLogger } from "../utils/debugLogger";

/**
 * Floating debug panel — only renders when ?debug=1 is in the URL.
 *
 * Provides:
 * - Live entry count
 * - "Dump Log" button to download the circular buffer as JSON
 * - "Clear" button to reset the buffer
 */
export const DebugPanel: React.FC = () => {
    const [count, setCount] = useState(0);

    // Refresh count every second so the display stays current
    useEffect(() => {
        if (!debugLogger.isEnabled()) {
            return;
        }
        const id = window.setInterval(() => {
            setCount(debugLogger.count());
        }, 1000);
        return () => window.clearInterval(id);
    }, []);

    if (!debugLogger.isEnabled()) {
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
