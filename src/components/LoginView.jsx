import React, { useState } from 'react'
import { login, register } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Eye, EyeOff } from 'lucide-react'

const EMAIL_MAX = 254
const PASSWORD_MAX = 128
const COMPANY_MAX = 100

function validateEmail(v) {
  if (!v.trim()) return 'Email ID is required'
  if (v.length > EMAIL_MAX) return `Maximum ${EMAIL_MAX} characters`
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address'
  return ''
}

function validatePassword(v) {
  if (!v) return 'Password is required'
  if (v.length < 6) return 'At least 6 characters'
  if (v.length > PASSWORD_MAX) return `Maximum ${PASSWORD_MAX} characters`
  return ''
}

function validateCompany(v) {
  if (v.length > COMPANY_MAX) return `Maximum ${COMPANY_MAX} characters`
  return ''
}

export default function LoginView() {
  const { setAuth } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({})
  const [formErrors, setFormErrors] = useState({})

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }))

  const validateField = (field, value) => {
    switch (field) {
      case 'email': return validateEmail(value)
      case 'password': return validatePassword(value)
      case 'company': return validateCompany(value)
      default: return ''
    }
  }

  const updateField = (field, setter) => (e) => {
    const val = e.target.value
    setter(val)
    if (touched[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: validateField(field, val) }))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    // Validate all fields
    const errors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    if (mode === 'register') {
      errors.company = validateCompany(company)
    }
    setFormErrors(errors)
    setTouched({ email: true, password: true, company: true })
    if (errors.email || errors.password || errors.company) return

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

  const switchTo = (newMode) => {
    setMode(newMode)
    setError('')
    // Retain entered data when switching modes
    // Don't clear email, password, or company
  }

  const hasFieldError = (field) => touched[field] && formErrors[field]

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

        <form onSubmit={submit} noValidate>
          <div className="frow">
            <label className="flab">Email ID<span className="req">*</span></label>
            <input
              className={`finp${hasFieldError('email') ? ' finp-error' : ''}`}
              type="email"
              value={email}
              onChange={updateField('email', setEmail)}
              onBlur={() => touch('email')}
              placeholder={mode === 'login' ? 'you@company.com' : 'you@company.com'}
              maxLength={EMAIL_MAX}
              required
              autoFocus
            />
            {hasFieldError('email') ? <div className="ferr">{formErrors.email}</div> : email.length > 0 && <div className="fchar">{email.length}/{EMAIL_MAX}</div>}
          </div>

          <div className="frow">
            <label className="flab">Password<span className="req">*</span></label>
            <div className="finp-wrap">
              <input
                className={`finp${hasFieldError('password') ? ' finp-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={updateField('password', setPassword)}
                onBlur={() => touch('password')}
                placeholder={mode === 'login' ? 'Enter your password' : 'Minimum 6 characters'}
                maxLength={PASSWORD_MAX}
                required
              />
              <button type="button" className="finp-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {hasFieldError('password') ? <div className="ferr">{formErrors.password}</div> : password.length > 0 ? <div className="fchar">{password.length}/{PASSWORD_MAX}</div> : mode === 'register' && <div className="fhint">At least 6 characters</div>}
          </div>

          {mode === 'register' && (
            <div className="frow">
              <label className="flab">Company name <span className="opt">(optional)</span></label>
              <input
                className={`finp${hasFieldError('company') ? ' finp-error' : ''}`}
                type="text"
                value={company}
                onChange={updateField('company', setCompany)}
                onBlur={() => touch('company')}
                placeholder="e.g. Acme Corp"
                maxLength={COMPANY_MAX}
              />
              {hasFieldError('company') ? <div className="ferr">{formErrors.company}</div> : company.length > 0 && <div className="fchar">{company.length}/{COMPANY_MAX}</div>}
            </div>
          )}

          <button className="ps-btn pri" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
            {busy ? <span className="spinner dark" /> : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'login' ? (
            <>Don't have an account? <button className="ps-btn subtle sm" onClick={() => switchTo('register')} style={{ marginLeft: 4 }}>Register</button></>
          ) : (
            <>Already have an account? <button className="ps-btn subtle sm" onClick={() => switchTo('login')} style={{ marginLeft: 4 }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}