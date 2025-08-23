import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Notify the HTML that the app is ready - instant loading
setTimeout(() => {
  window.dispatchEvent(new Event('app-ready'));
}, 10); // Minimal delay for instant transition
