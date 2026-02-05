import React from "react";
import ReactDOM from "react-dom/client";
import { LayoutRoot } from "./layouts";
import { useLayout } from "./hooks/useLayout";
import { ThemeProvider } from "./theme";
import { UserProvider } from "./context/UserContext";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);

/**
 * App component that renders the appropriate layout.
 * Uses the useLayout hook for layout selection.
 */
const App: React.FC = () => {
    const layoutSelector = useLayout;
    return <LayoutRoot layoutSelector={layoutSelector} />;
};

root.render(
    <React.StrictMode>
        <UserProvider>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </UserProvider>
    </React.StrictMode>
);
