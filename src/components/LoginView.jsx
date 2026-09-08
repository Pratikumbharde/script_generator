import React, { useState, useEffect } from 'react'
import { login, register, forgotPassword, resetPassword } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useBrand } from '../context/BrandContext.jsx'
import { requestTour } from '../utils/tourSignal.js'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

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

export default function LoginView({ initialMode = 'login', onBack, onModeChange }) {
  const { setAuth } = useAuth()
  const { branding } = useBrand()
  const [mode, setMode] = useState(initialMode) // 'login' | 'register' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [resetToken, setResetToken] = useState('')

  // If the user arrived via a password-reset email link (?resetToken=...&email=...),
  // drop straight into the reset-password form.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('resetToken')
    const resetEmail = params.get('email')
    if (token && resetEmail) {
      setResetToken(token)
      setEmail(resetEmail)
      setMode('reset')
      // Strip the token out of the visible URL so it isn't kept in history/bookmarks.
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }))

  const validateField = (field, value) => {
    switch (field) {
      case 'email': return validateEmail(value)
      case 'password': return validatePassword(value)
      case 'confirmPassword': return value !== password ? 'Passwords do not match' : ''
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

    if (mode === 'forgot') {
      const errors = { email: validateEmail(email) }
      setFormErrors(errors)
      setTouched({ email: true })
      if (errors.email) return

      setError('')
      setInfo('')
      setBusy(true)
      try {
        const data = await forgotPassword(email)
        if (data.status === 'sent') {
          setInfo(data.message || 'A password reset link has been emailed to you. Check your inbox (and spam folder).')
        } else {
          setError(data.message || 'Something went wrong while sending the reset email. Please try again.')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
      return
    }

    if (mode === 'reset') {
      const errors = {
        password: validatePassword(password),
        confirmPassword: password !== confirmPassword ? 'Passwords do not match' : '',
      }
      setFormErrors(errors)
      setTouched({ password: true, confirmPassword: true })
      if (errors.password || errors.confirmPassword) return

      setError('')
      setInfo('')
      setBusy(true)
      try {
        const data = await resetPassword(resetToken, email, password)
        setInfo(data.message || 'Password updated. You can now sign in.')
        setPassword('')
        setConfirmPassword('')
        setTouched({})
        setMode('login')
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
      return
    }

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
      // Show the quick-start tour on this login (once per login, not on refresh)
      requestTour()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchTo = (newMode) => {
    setMode(newMode)
    setError('')
    setInfo('')
    setTouched({})
    setFormErrors({})
    // Keep the URL path in sync with the visible mode
    onModeChange?.(newMode)
    // Retain entered data when switching modes
    // Don't clear email, password, or company
  }

  const hasFieldError = (field) => touched[field] && formErrors[field]

  return (
    <div className="af-shell">
      <div className="ps-form af-card">
        {/* Brand + mode subtitle */}
        <div className="af-head">
          <div className="ps-brand af-brand">
            {branding.logo_data
              ? <img src={branding.logo_data} alt={branding.site_name} className="af-brand-logo" />
              : <span className="dot" />}
            {/* <span>{branding.site_name}</span> */}
          </div>
          <div className="ps-sub af-sub">
            {mode === 'login' && 'Sign in to your workspace'}
            {mode === 'register' && 'Create your workspace'}
            {mode === 'forgot' && 'We’ll email you a link to reset it'}
            {mode === 'reset' && 'Choose a new password for your account'}
          </div>
        </div>

        {error && <div className="err af-banner">{error}</div>}
        {info && <div className="ok-msg af-banner">{info}</div>}

        <form onSubmit={submit} noValidate>
          <div className="af-fields">
            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div className="af-field">
                <label className="flab" style={{ marginBottom: 6 }}>Email ID<span className="req">*</span></label>
                <input
                  className={`finp${hasFieldError('email') ? ' finp-error' : ''}`}
                  type="email"
                  value={email}
                  onChange={updateField('email', setEmail)}
                  onBlur={() => touch('email')}
                  placeholder="you@company.com"
                  maxLength={EMAIL_MAX}
                  required
                  autoFocus
                />
                <div className="af-meta">{hasFieldError('email') ? <div className="ferr">{formErrors.email}</div> : email.length > 0 && <div className="fchar">{email.length}/{EMAIL_MAX}</div>}</div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="af-field">
                <div className="af-label-row">
                  <label className="flab">{mode === 'reset' ? 'New password' : 'Password'}<span className="req">*</span></label>
                  {mode === 'login' && (
                    <button type="button" className="af-forgot" onClick={() => switchTo('forgot')}>Forgot password?</button>
                  )}
                </div>
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
                    autoFocus={mode === 'reset'}
                  />
                  <button type="button" className="finp-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="af-meta">{hasFieldError('password') ? <div className="ferr">{formErrors.password}</div> : password.length > 0 ? <div className="fchar">{password.length}/{PASSWORD_MAX}</div> : (mode === 'register' || mode === 'reset') && <div className="fhint">At least 6 characters</div>}</div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="af-field">
                <label className="flab" style={{ marginBottom: 6 }}>Confirm new password<span className="req">*</span></label>
                <input
                  className={`finp${hasFieldError('confirmPassword') ? ' finp-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={updateField('confirmPassword', setConfirmPassword)}
                  onBlur={() => touch('confirmPassword')}
                  placeholder="Re-enter new password"
                  maxLength={PASSWORD_MAX}
                  required
                />
                <div className="af-meta">{hasFieldError('confirmPassword') && <div className="ferr">{formErrors.confirmPassword}</div>}</div>
              </div>
            )}

            {mode === 'register' && (
              <div className="af-field">
                <label className="flab" style={{ marginBottom: 6 }}>Company name <span className="opt">(optional)</span></label>
                <input
                  className={`finp${hasFieldError('company') ? ' finp-error' : ''}`}
                  type="text"
                  value={company}
                  onChange={updateField('company', setCompany)}
                  onBlur={() => touch('company')}
                  placeholder="e.g. Acme Corp"
                  maxLength={COMPANY_MAX}
                />
                <div className="af-meta">{hasFieldError('company') ? <div className="ferr">{formErrors.company}</div> : company.length > 0 && <div className="fchar">{company.length}/{COMPANY_MAX}</div>}</div>
              </div>
            )}
          </div>

          <button className="ps-btn pri af-submit" type="submit" disabled={busy}>
            {busy ? <span className="spinner dark" /> : (
              mode === 'login' ? 'Sign in' :
              mode === 'register' ? 'Create account' :
              mode === 'forgot' ? 'Send reset link' :
              'Reset password'
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="af-switch">
          {mode === 'login' && (
            <>Don't have an account? <button className="ps-btn subtle sm" onClick={() => switchTo('register')}>Register</button></>
          )}
          {mode === 'register' && (
            <>Already have an account? <button className="ps-btn subtle sm" onClick={() => switchTo('login')}>Sign in</button></>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <>Remembered your password? <button className="ps-btn subtle sm" onClick={() => switchTo('login')}>Sign in</button></>
          )}
        </div>

        {/* Back to landing — visually apart at the bottom of the card */}
        {onBack && (
          <div className="af-divider">
            <button type="button" className="af-back" onClick={onBack}>
              <ArrowLeft size={14} /> Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}