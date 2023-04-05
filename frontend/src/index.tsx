import * as React from 'react'
import { App } from './App'
import * as ReactDOMClient from 'react-dom/client';
const container = document.getElementById('root');

const root = ReactDOMClient.createRoot(container);

// why this doesnot render on the browser



root.render(<App />)


