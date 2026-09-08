import React, { createContext, useContext, useState, useEffect } from 'react'
import { me, logout as apiLogout } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  // Start with loading=false when there's no token, so logged-out refreshes
  // render the landing page immediately instead of flashing the dashboard
  // skeleton for a frame before the auth check runs.
  const [loading, setLoading] = useState(() => !!localStorage.getItem('ps_token'))

  useEffect(() => {
    const token = localStorage.getItem('ps_token')
    if (!token) {
      setLoading(false)
      return
    }
    me()
      .then((data) => {
        setUser(data.user)
        setWorkspace(data.workspace || null)
      })
      .catch(() => {
        apiLogout()
        setUser(null)
        setWorkspace(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const setAuth = (token, userData) => {
    if (token) localStorage.setItem('ps_token', token)
    setUser(userData)
  }

  const setWorkspaceData = (ws) => {
    setWorkspace(ws)
  }

  const doLogout = () => {
    apiLogout()
    setUser(null)
    setWorkspace(null)
    // Full reload to the landing page — a soft redirect leaves stale in-memory
    // state (active view, products, branding) behind; a fresh boot re-runs
    // auth check, branding fetch and view init from scratch.
    window.location.replace('/')
  }

  const canGenerate = user?.role === 'admin' || user?.role === 'manager'

  return (
    <AuthContext.Provider value={{ user, workspace, loading, setAuth, setWorkspace: setWorkspaceData, logout: doLogout, canGenerate }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
