import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { cleanOldBrowserData } from './lib/cleanupBrowserData';
import { registerSW } from 'virtual:pwa-register';

// Auto-clean stale data from older builds on rifff.eu.cc
cleanOldBrowserData();

// Register Service Worker for native PWA installation
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, refreshing...');
  },
  onOfflineReady() {
    console.log('Riff is ready for offline use');
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
