import { USERS, getSession } from '../db/store.js';
import { sanitizeUser } from './security.js';

export const SESSION_COOKIE_NAME = 'mindspring_session';

/**
 * Lightweight cookie parsing middleware
 */
export function cookieParser(req, res, next) {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = pair.substring(0, idx).trim();
        const val = pair.substring(idx + 1).trim();
        try {
          req.cookies[key] = decodeURIComponent(val);
        } catch {
          req.cookies[key] = val;
        }
      }
    }
  }
  next();
}

/**
 * Set HttpOnly, SameSite=Lax, Secure (in production) session cookie
 */
export function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 24 * 60 * 60; // 1 day in seconds
  const cookieVal = `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieVal);
}

/**
 * Clear session cookie on logout
 */
export function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieVal = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieVal);
}

/**
 * Check if demo mode is permitted in the current environment
 * Fails closed in production or when NODE_ENV is unset/unrecognized.
 */
export function isDemoModeAllowed() {
  const env = process.env.NODE_ENV;
  return (env === 'development' || env === 'test') && process.env.ENABLE_DEMO_MODE !== 'false';
}

/**
 * Authenticate session from HttpOnly cookie or validated Bearer header
 */
export function authenticateSession(req, res, next) {
  let token = null;
  let authMethod = null;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    token = req.cookies[SESSION_COOKIE_NAME];
    authMethod = 'cookie';
  }
  // 2. Check Bearer token (for legitimate API clients and integration tests)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
    authMethod = 'bearer';
  }

  if (token) {
    const session = getSession(token);
    if (session) {
      const user = USERS.find(u => u.id === session.userId);
      if (user) {
        req.user = sanitizeUser(user);
        req.rawUser = user;
        req.session = session;
        req.sessionToken = token;
        req.authMethod = authMethod;
      }
    }
  }

  next();
}

/**
 * Require valid authentication on protected routes
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Enforce role-based access control
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role permissions' });
    }
    next();
  };
}
