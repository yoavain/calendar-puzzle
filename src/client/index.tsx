import React from 'react';
import ReactDOM from 'react-dom/client';
import { Game } from './components/Game';
import { ThemeProvider } from './theme';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <ThemeProvider>
            <Game />
        </ThemeProvider>
    </React.StrictMode>
);
