import React, { useState } from 'react'
import { login, register } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginView() {
  const { setAuth } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      let data
      if (mode === 'login') {
        data = await login(email, password)
      } else {
        data = await register(email, password, company)
      }
      setAuth(data.token, data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div className="ps-form" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="ps-brand" style={{ justifyContent: 'center', marginBottom: 8, color: 'var(--ink)' }}>
            <span className="dot" /><span>Pitch Studio</span>
          </div>
          <div className="ps-sub">{mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}</div>
        </div>

        {error && <div className="err" style={{ marginBottom: 14 }}>{error}</div>}

        <form onSubmit={submit}>
          <div className="frow">
            <label className="flab">Email</label>
            <input className="finp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>

          <div className="frow">
            <label className="flab">Password</label>
            <div className="finp-wrap">
              <input className="finp" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <button type="button" className="finp-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="fhint">{mode === 'register' && 'At least 6 characters'}</div>
          </div>

          {mode === 'register' && (
            <div className="frow">
              <label className="flab">Company name <span className="opt">(optional)</span></label>
              <input className="finp" type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          )}

          <button className="ps-btn pri" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
            {busy ? <span className="spinner dark" /> : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'login' ? (
            <>Don't have an account? <button className="ps-btn subtle sm" onClick={() => { setMode('register'); setError('') }} style={{ marginLeft: 4 }}>Register</button></>
          ) : (
            <>Already have an account? <button className="ps-btn subtle sm" onClick={() => { setMode('login'); setError('') }} style={{ marginLeft: 4 }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
