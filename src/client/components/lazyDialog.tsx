import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { logToServer } from "../service/logService.js";

interface DialogProps {
    open: boolean;
    onClose: () => void;
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
 * so the close transition can finish. The chunk also loads in the background shortly after
 * the page loads, so the first open rarely waits for the network.
 *
 * @param load Dynamic import that resolves to the dialog component as `default`.
 * @param name Dialog name, used in the log line when the chunk fails to load.
 */
export const lazyDialog = <P extends DialogProps>(
    load: () => Promise<{ default: React.ComponentType<P> }>,
    name: string
): React.FC<P> => {
    const LazyComponent = lazy(load);

    const LazyDialog: React.FC<P> = (props) => {
        const [hasOpened, setHasOpened] = useState(props.open);
        if (props.open && !hasOpened) {
            setHasOpened(true);
        }

        useEffect(() => {
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

        const { onClose } = props;
        const handleError = useMemo(() => (error: unknown) => {
            logToServer("error", `lazyDialog: failed to load ${name}`, error);
            onClose();
        }, [onClose]);

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
