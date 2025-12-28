import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

async function bootstrap() {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        const { worker } = await import('./mocks/browser');
        await worker.start({ onUnhandledRequest: 'bypass' });
        console.log('[MSW] Mock Service Worker enabled');
    }

    createRoot(document.getElementById('root') as HTMLElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

bootstrap();
