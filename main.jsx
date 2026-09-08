import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app.jsx'
import { AuthProvider } from './src/context/AuthContext.jsx'
import { BrandProvider } from './src/context/BrandContext.jsx'
import ErrorBoundary from './src/components/ErrorBoundary.jsx'

/* PWA service worker — production only. In dev the SW's cache serves stale
   bundles and retries dead ports, which masks the real (already-fixed) errors. */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('[PWA] SW registered:', reg.scope))
      .catch((err) => console.warn('[PWA] SW registration failed:', err));
  });
} else if ('serviceWorker' in navigator) {
  // Dev: unregister any SW left over from a previous prod build on this origin
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
}

/* Disable the browser's scroll-position restore on reload — it restores the
   offset against the auth-skeleton layout before the real page renders,
   leaving the landing page (and views) scrolled partway down on refresh. */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrandProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrandProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
