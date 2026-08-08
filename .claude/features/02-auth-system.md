# Feature 02: Authentication System

## Status
✅ Implemented

## Overview
Secure registration and login with JWT tokens, bcrypt password hashing, and automatic session restoration.

## Architecture
```
Frontend: LoginView → AuthContext → API Client → localStorage (token)
                                                            ↓
Backend: Express → requireAuth middleware → JWT verify → user_id scoping
```

## Components

### LoginView.jsx
- Toggle between Login and Register modes
- Email + password fields
- Company name (register only, optional)
- Error display
- Loading spinner on submit
- Link to switch modes

### AuthContext.jsx
- `user` — current user object or null
- `loading` — verifying session on mount
- `setAuth(token, user)` — after login/register
- `logout()` — clear token + user
- Auto-restores: on mount, if token exists, calls /api/auth/me

### API Client
- `register(email, password, company_name)`
- `login(email, password)`
- `me()` — verify token
- All store token in localStorage on success

## Backend

### POST /api/auth/register
- Validate email + password presence
- Check email uniqueness (409 if duplicate)
- bcrypt.hashSync(password, 10)
- Insert user
- Issue JWT (7-day expiry)
- Return { token, user }

### POST /api/auth/login
- Find user by email
- bcrypt.compareSync(password, hash)
- Issue JWT
- Return { token, user }

### GET /api/auth/me
- Verify JWT from Authorization header
- Return user (id, email, company_name)

### requireAuth middleware
- Extract Bearer token
- jwt.verify(token, JWT_SECRET)
- Attach userId to request
- All subsequent routes use req.userId

## Security
- Passwords: bcrypt with salt rounds 10
- JWT: HS256, 7-day expiry, secret in .env
- Data isolation: every query includes `WHERE user_id = ?`
- CORS: enabled for dev (restrict in production)

## Files
- `src/components/LoginView.jsx`
- `src/context/AuthContext.jsx`
- `src/api/client.js`
- `server.js` (auth routes)

## Future Enhancements
- [ ] Password reset flow (email token)
- [ ] Email verification
- [ ] OAuth (Google, Microsoft)
- [ ] MFA / TOTP
- [ ] Session management (view active sessions, revoke)
- [ ] Rate limiting on auth endpoints
