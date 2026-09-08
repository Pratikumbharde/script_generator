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

/* Disable the browser's scroll-position restore on reload — it restores the
   offset against the auth-skeleton layout before the real page renders,
   leaving the landing page (and views) scrolled partway down on refresh. */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

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
