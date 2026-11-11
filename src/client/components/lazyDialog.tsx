import React, { Suspense, lazy, useEffect, useState } from "react";
import { logToServer } from "../service/logService.js";

interface LazyDialogOptions<P> {
    /** Dialog name, used in the log line when the chunk fails to load. */
    name: string;
    /** Reads the open state from the dialog props. Dialogs name this prop differently. */
    isOpen: (props: P) => boolean;
    /** Closes the dialog. The wrapper calls it when the chunk fails to load. */
    close: (props: P) => void;
    /** Fetch the chunk in the background after the page loads. Turn this off for a rare dialog. Default: true. */
    preload?: boolean;
}

/** Wait this long after the page `load` event before fetching the dialog chunk in the background. */
const PRELOAD_DELAY_MS = 1500;

interface BoundaryProps {
    onError: (error: unknown) => void;
    children: React.ReactNode;
}

/**
 * Catches a failed chunk load. A tab that was open during a deploy can ask for a chunk
 * that no longer exists. The dialog closes and the failure goes to the server log.
 */
class ChunkErrorBoundary extends React.Component<BoundaryProps, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: unknown) {
        this.props.onError(error);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

/**
 * Wraps a dialog so its code loads on first open and not with the first page.
 *
 * The wrapper renders nothing until the dialog first opens. After that it stays mounted,
 * so the close transition can finish. By default the chunk also loads in the background
 * shortly after the page loads, so the first open rarely waits for the network.
 *
 * @param load Dynamic import that resolves to the dialog component as `default`.
 * @param options Name, open-state reader, close function and preload switch.
 */
export const lazyDialog = <P extends object>(
    load: () => Promise<{ default: React.ComponentType<P> }>,
    { name, isOpen, close, preload = true }: LazyDialogOptions<P>
): React.FC<P> => {
    const LazyComponent = lazy(load);

    const LazyDialog: React.FC<P> = (props) => {
        const open = isOpen(props);
        const [hasOpened, setHasOpened] = useState(open);
        if (open && !hasOpened) {
            setHasOpened(true);
        }

        useEffect(() => {
            if (!preload) {
                return undefined;
            }
            let timer: ReturnType<typeof setTimeout> | undefined;
            const startPreload = () => {
                timer = setTimeout(() => {
                    load().catch(() => {});
                }, PRELOAD_DELAY_MS);
            };
            if (document.readyState === "complete") {
                startPreload();
            }
            else {
                window.addEventListener("load", startPreload, { once: true });
            }
            return () => {
                clearTimeout(timer);
                window.removeEventListener("load", startPreload);
            };
        }, []);

        const handleError = (error: unknown) => {
            logToServer("error", `lazyDialog: failed to load ${name}`, error);
            close(props);
        };

        if (!hasOpened) {
            return null;
        }
        return (
            <ChunkErrorBoundary onError={handleError}>
                <Suspense fallback={null}>
                    <LazyComponent {...props} />
                </Suspense>
            </ChunkErrorBoundary>
        );
    };
    LazyDialog.displayName = `LazyDialog(${name})`;
    return LazyDialog;
};
