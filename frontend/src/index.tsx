import * as React from 'react'

import { App } from './App'
import { render } from 'react-dom';
const root = document.getElementById('root');

// why this doesnot render on the browser
render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    root
  );