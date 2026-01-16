import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/styles.css';
import { Game } from './components/Game';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <div className="app">
            <Game />
        </div>
    </React.StrictMode>
); 