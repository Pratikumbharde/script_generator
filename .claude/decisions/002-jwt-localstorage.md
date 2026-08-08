# ADR 002: JWT in localStorage

## Status
Accepted with caveat

## Context
Where to store the JWT token:
1. localStorage (easy, works for SPAs)
2. httpOnly cookie (XSS protection, CSRF risk)
3. Memory only (secure but loses session on refresh)
4. Service Worker / IndexedDB (complex)

## Decision
Store JWT in **localStorage**.

## Rationale
- **Simplicity:** No cookie parsing, no CSRF tokens needed
- **SPA-friendly:** JavaScript can attach token to every fetch
- **Cross-domain:** If frontend and API are on different domains, cookies need SameSite handling
- **Mobile/PWA ready:** localStorage works in all contexts

## Security Measures
- Token expires in 7 days (short-lived)
- All API calls over HTTPS in production
- XSS is mitigated by:
  - No user-generated HTML rendered without sanitization
  - Content Security Policy headers (production)
  - React's built-in XSS protection
- API key is server-side only (never in localStorage or frontend code)

## Trade-offs
- XSS attack could steal token → we mitigate with CSP and input sanitization
- Token persists until expiry or explicit logout

## Future Improvement
Add refresh token rotation:
- Short-lived access token (15 min)
- Long-lived refresh token in httpOnly cookie
- Reduces XSS window significantly

## When to Revisit
- If we add sensitive financial data
- If we go enterprise/SAML
- If we implement MFA
