import * as React from 'react'

import { App } from './App'
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container); 
// why this doesnot render on the browser
root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );