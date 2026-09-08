import React, { createContext, useContext, useEffect, useState } from 'react'
import { getBranding } from '../api/client.js'
import { DEFAULT_BRANDING, DEFAULT_LANDING, mergeBranding, mergeLanding } from '../data/brandingDefaults.js'

/* ============================================================
   BrandContext — global site branding (name, logo, favicon, meta
   tags, landing copy) loaded from the public /api/branding endpoint.

   Why public: the landing, login and register screens all render
   before the visitor has a token. The first paint uses the
   localStorage cache (or the hardcoded defaults), then the network
   response is merged in — so nothing blocks or breaks if the
   request fails, and every consumer falls back to the original
   hardcoded content when the admin has saved nothing.
   ============================================================ */

const BRAND_CACHE_KEY = 'ps_branding'

function readCache() {
  try {
    const raw = localStorage.getItem(BRAND_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/* Push branding into the document head — runs on every branding change. */
function applyToDocument(branding) {
  const name = branding.site_name || DEFAULT_BRANDING.site_name
  try { document.title = name } catch { /* noop */ }

  const setMeta = (selector, attr, value) => {
    let el = document.head.querySelector(selector)
    if (!el) {
      el = document.createElement('meta')
      const [, kind, key] = selector.match(/\[(\w+)="([^"]+)"\]/) || []
      if (kind && key) el.setAttribute(kind, key)
      document.head.appendChild(el)
    }
    if (value) el.setAttribute(attr, value)
  }
  setMeta('meta[name="description"]', 'content', branding.meta_description || DEFAULT_BRANDING.meta_description)
  setMeta('meta[name="keywords"]', 'content', branding.meta_keywords || DEFAULT_BRANDING.meta_keywords)
  setMeta('meta[name="apple-mobile-web-app-title"]', 'content', name)

  // Favicon: saved favicon → saved logo → the shipped default icon.
  const iconHref = branding.favicon_data || branding.logo_data || '/icons/icon-192.png'
  let icon = document.head.querySelector('link[rel="icon"]')
  if (!icon) {
    icon = document.createElement('link')
    icon.rel = 'icon'
    document.head.appendChild(icon)
  }
  if (icon.getAttribute('href') !== iconHref) icon.setAttribute('href', iconHref)

  // PWA manifest served dynamically so name/icons follow the branding too.
  let manifest = document.head.querySelector('link[rel="manifest"]')
  if (manifest && manifest.getAttribute('href') !== '/api/branding/manifest') {
    manifest.setAttribute('href', '/api/branding/manifest')
  }
}

const BrandContext = createContext(null)

export function BrandProvider({ children }) {
  // Seed from the cache so the very first paint already shows a saved
  // site name / logo (no flash of the default).
  const [branding, setBranding] = useState(() => {
    const cached = readCache()
    return cached ? mergeBranding(cached) : DEFAULT_BRANDING
  })
  const [landing, setLanding] = useState(() => {
    const cached = readCache()
    return mergeLanding(cached?.landing || null)
  })

  const ingest = (saved) => {
    const b = mergeBranding(saved)
    const l = mergeLanding(saved?.landing || null)
    setBranding(b)
    setLanding(l)
    try { localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify(saved || {})) } catch { /* private mode */ }
  }

  useEffect(() => {
    let alive = true
    getBranding()
      .then((saved) => { if (alive) ingest(saved) })
      .catch(() => { /* keep defaults / cache */ })
    return () => { alive = false }
  }, [])

  useEffect(() => { applyToDocument(branding) }, [branding])

  return (
    <BrandContext.Provider value={{ branding, landing, refresh: ingest }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  return useContext(BrandContext)
}

/* Replace the hardcoded default product name in copy (tour steps, landing
   text, empty states…) with the admin's saved site name. */
export function withSiteName(text, siteName) {
  const name = siteName || DEFAULT_BRANDING.site_name
  return String(text || '').split('Pitch Studio').join(name)
}