import React from 'react';
import ReactDOM from 'react-dom/client';
import { Game } from './components/Game';
import { ThemeProvider } from './theme';
import { UserProvider } from './context/UserContext';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <UserProvider>
            <ThemeProvider>
                <Game />
            </ThemeProvider>
        </UserProvider>
    </React.StrictMode>
);
