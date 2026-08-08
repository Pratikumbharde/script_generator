import React, { createContext, useContext, useState, useEffect } from 'react'
import { me, logout as apiLogout } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)

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
  }

  return (
    <AuthContext.Provider value={{ user, workspace, loading, setAuth, setWorkspace: setWorkspaceData, logout: doLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
