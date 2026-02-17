import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LayoutRoot } from "./layouts";
import { useLayout } from "./hooks/useLayout";
import { ThemeProvider } from "./theme";
import { UserProvider } from "./context/UserContext";
import { LandingPage } from "./pages/LandingPage";

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

// In dev, Vite serves under /client/ base; in production, served at /
const basename = import.meta.env.DEV
    ? import.meta.env.BASE_URL.replace(/\/$/, "")
    : "/";

root.render(
    <React.StrictMode>
        <UserProvider>
            <ThemeProvider>
                <BrowserRouter basename={basename}>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/play" element={<App />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </UserProvider>
    </React.StrictMode>
);
