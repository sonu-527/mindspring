import express from 'express';
import { USERS, AUDIT_LOGS, createSession, revokeSession } from '../db/store.js';
import { hashPassword, verifyPassword, dummyVerify, sanitizeUser } from '../middleware/security.js';
import {
  setSessionCookie,
  clearSessionCookie,
  isDemoModeAllowed,
  requireAuth
} from '../middleware/auth.js';

const router = express.Router();

// GET /api/auth/demo-users
router.get('/demo-users', (req, res) => {
  if (!isDemoModeAllowed()) {
    return res.status(403).json({ error: 'Demo mode is disabled in this environment' });
  }

  const demoUsers = USERS.filter(u => u.isDemoFixture).map(sanitizeUser);
  res.json({ users: demoUsers });
});

// GET /api/auth/me
// Strictly returns the currently authenticated user or 401. Never creates fake/default session.
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  res.json({ user: req.user });
});

// POST /api/auth/demo-bootstrap
// Dev/test-only endpoint for explicit initial authentication bootstrapping
router.post('/demo-bootstrap', (req, res) => {
  if (!isDemoModeAllowed()) {
    return res.status(403).json({ error: 'Demo bootstrap is only available in development and test environments' });
  }

  const { userId, role } = req.body || {};
  let target = null;
  if (userId) {
    target = USERS.find(u => u.isDemoFixture && u.id === userId);
  } else if (role) {
    target = USERS.find(u => u.isDemoFixture && u.role === role);
  } else {
    // Default to Aarav Sharma
    target = USERS.find(u => u.isDemoFixture && u.id === 'student-1');
  }

  if (!target) {
    return res.status(404).json({ error: 'Demo fixture not found' });
  }

  // Revoke previous session if one exists
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }

  const { token } = createSession(target.id, target.role);
  setSessionCookie(res, token);

  res.json({ success: true, user: sanitizeUser(target) });
});

// POST /api/auth/switch-role
// Dev/test-only endpoint to switch between demo fixtures
router.post('/switch-role', (req, res) => {
  if (!isDemoModeAllowed()) {
    return res.status(403).json({ error: 'Role switching is only available in development and test environments' });
  }

  const { role, userId } = req.body || {};
  let target = null;
  if (userId) {
    target = USERS.find(u => u.isDemoFixture && u.id === userId);
  } else if (role) {
    target = USERS.find(u => u.isDemoFixture && u.role === role);
  }

  if (!target) {
    return res.status(404).json({ error: 'Target role/user not found' });
  }

  // Revoke previous session token
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }

  const { token } = createSession(target.id, target.role);
  setSessionCookie(res, token);

  AUDIT_LOGS.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorRole: target.role,
    actorName: target.name,
    action: 'ROLE_SWITCHED',
    details: `Switched demo role to ${target.role} (${target.id})`
  });

  res.json({ success: true, user: sanitizeUser(target) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { userId, email, password } = req.body || {};

  // Dev/test mode: allow demo fixture quick-login without password if userId provided
  if (userId && !password && isDemoModeAllowed()) {
    const target = USERS.find(u => u.id === userId && u.isDemoFixture);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.sessionToken) {
      revokeSession(req.sessionToken);
    }

    const { token } = createSession(target.id, target.role);
    setSessionCookie(res, token);

    AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorRole: target.role,
      actorName: target.name,
      action: 'USER_LOGIN',
      details: `User logged in under role: ${target.role}`
    });

    return res.json({ success: true, user: sanitizeUser(target) });
  }

  if (!email && !userId) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const found = USERS.find(u => (email && u.email === email) || (userId && u.id === userId));
  if (!found) {
    dummyVerify();
    return res.status(404).json({ error: 'User not found' });
  }

  if (password) {
    const isValid = verifyPassword(password, found.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  // Revoke old session if present
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }

  // Rotate session
  const { token } = createSession(found.id, found.role);
  setSessionCookie(res, token);

  AUDIT_LOGS.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorRole: found.role,
    actorName: found.name,
    action: 'USER_LOGIN',
    details: `User logged in under role: ${found.role}`
  });

  res.json({ success: true, user: sanitizeUser(found) });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, ageGroup, examGoal, subjects, dailyTargetHours, parentConsent } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  if (USERS.some(u => u.email === email)) {
    return res.status(409).json({ error: 'Email is already registered' });
  }

  let effectivePassword = password;
  if (effectivePassword) {
    if (typeof effectivePassword !== 'string' || effectivePassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
  } else if (isDemoModeAllowed()) {
    effectivePassword = 'DefaultSecurePass123!';
  } else {
    return res.status(400).json({ error: 'Password is required' });
  }

  const passwordHash = hashPassword(effectivePassword);

  const newUser = {
    id: `student-${Date.now()}`,
    name,
    email,
    passwordHash,
    role: 'student',
    isDemoFixture: false,
    ageGroup: ageGroup || '16-18',
    examGoal: examGoal || 'JEE Main',
    targetScore: 'Aiming for dream rank',
    subjects: subjects || ['Physics', 'Chemistry', 'Mathematics'],
    dailyTargetHours: dailyTargetHours || 6,
    consentGiven: Boolean(parentConsent),
    emergencyContact: null
  };

  USERS.push(newUser);

  // Revoke old session if present
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }

  const { token } = createSession(newUser.id, newUser.role);
  setSessionCookie(res, token);

  AUDIT_LOGS.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorRole: 'student',
    actorName: name,
    action: 'STUDENT_REGISTERED',
    details: `Registered for exam goal: ${examGoal}`
  });

  res.json({ success: true, user: sanitizeUser(newUser) });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (req.sessionToken) {
    revokeSession(req.sessionToken);
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/consent
router.post('/consent', requireAuth, (req, res) => {
  const { consentGiven, emergencyContact } = req.body || {};

  req.rawUser.consentGiven = Boolean(consentGiven);
  if (emergencyContact) {
    req.rawUser.emergencyContact = emergencyContact;
  }

  AUDIT_LOGS.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorRole: req.rawUser.role,
    actorName: req.rawUser.name,
    action: 'PRIVACY_CONSENT_UPDATED',
    details: `Consent flag set to ${req.rawUser.consentGiven}`
  });

  res.json({ success: true, user: sanitizeUser(req.rawUser) });
});

export default router;
