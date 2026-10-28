import { getSession } from '../db/store.js';
import { SESSION_COOKIE_NAME } from './auth.js';

function isAllowedOrigin(origin, hostHeader) {
  if (!origin || typeof origin !== 'string') return false;
  try {
    const url = new URL(origin);
    const originHost = url.host; // includes port if any

    // Frontend dev servers
    if (url.origin === 'http://localhost:3000' || url.origin === 'http://127.0.0.1:3000') return true;

    // Backend dev servers
    if (url.origin === 'http://localhost:5000' || url.origin === 'http://127.0.0.1:5000') return true;

    // Configured production origin
    if (process.env.APP_ORIGIN && url.origin === process.env.APP_ORIGIN) return true;

    // Direct match against request Host header
    if (hostHeader && originHost === hostHeader) return true;

    // In test environment, allow any loopback port allocated by test runner
    if (process.env.NODE_ENV === 'test') {
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * CSRF Protection Middleware
 * Defends cookie-authenticated unsafe browser requests (POST, PUT, DELETE, PATCH)
 * using strict Origin/Referer verification and Sec-Fetch-Site validation.
 */
export function csrfProtection(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 1. Bearer Token path: Non-browser API clients using genuine server-issued session tokens
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = getSession(token);
    if (session) {
      // Valid genuine token; passes CSRF
      return next();
    } else {
      // Arbitrary or invalid tokens cannot bypass CSRF
      return res.status(401).json({ error: 'Invalid or expired Bearer token' });
    }
  }

  // 2. Browser metadata: Sec-Fetch-Site
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite === 'cross-site') {
    return res.status(403).json({ error: 'CSRF check failed: Cross-site requests are forbidden' });
  }

  // 3. Strict Origin header validation
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    if (isAllowedOrigin(origin, host)) {
      return next();
    }
    return res.status(403).json({ error: 'CSRF check failed: Origin not allowed' });
  }

  // 4. Referer fallback if Origin is omitted
  const referer = req.headers.referer;
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (isAllowedOrigin(refererUrl.origin, host)) {
        return next();
      }
      return res.status(403).json({ error: 'CSRF check failed: Referer origin not allowed' });
    } catch {
      return res.status(403).json({ error: 'CSRF check failed: Invalid Referer header' });
    }
  }

  // 5. If neither Origin nor Referer is present:
  // In production, cookie-authenticated browser requests must send Origin or Referer
  if (process.env.NODE_ENV === 'production' && req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    return res.status(403).json({ error: 'CSRF check failed: Missing Origin or Referer header' });
  }

  // In development or test, allow requests without Origin/Referer (e.g. node test runner or curl)
  next();
}
