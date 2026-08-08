import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app.jsx'
import { AuthProvider } from './src/context/AuthContext.jsx'
import ErrorBoundary from './src/components/ErrorBoundary.jsx'

/* PWA service worker registration */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('[PWA] SW registered:', reg.scope))
      .catch((err) => console.warn('[PWA] SW registration failed:', err));
  });
}

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
