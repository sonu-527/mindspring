import express from 'express';
import { requireRole } from '../middleware/auth.js';
import {
  COUNSELLORS,
  CONSULTATION_REQUESTS,
  USERS,
  AUDIT_LOGS,
  TEACHERS
} from '../db/store.js';
import { CRISIS_HELPLINES } from '../services/safetyService.js';

const router = express.Router();

/**
 * Validates requested studentId against authenticated identity
 * Returns 404 if requested student does not exist, 403 on tenant mismatch, or acting studentId
 */
function getValidatedStudentKey(req, res) {
  const actingId = req.user.id;
  const requestedId = req.query.studentId || req.body?.studentId;

  if (requestedId) {
    const targetUser = USERS.find(u => u.id === requestedId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return null;
    }
    if (requestedId !== actingId) {
      res.status(403).json({ error: "Forbidden: Access to another student's support records is prohibited" });
      return null;
    }
  }
  return actingId;
}

// ==========================================
// Public / Shared Informational Endpoints
// ==========================================
router.get('/counsellors', (req, res) => {
  res.json({
    counsellors: COUNSELLORS,
    notice: 'All MindSpring counsellors are qualified mental health professionals registered with relevant professional councils (e.g., Rehabilitation Council of India / Indian Association of Clinical Psychologists).'
  });
});

router.get('/crisis-helplines', (req, res) => {
  res.json({
    helplines: CRISIS_HELPLINES,
    safeguardingDisclaimer: 'MindSpring is a non-clinical digital platform. In cases of acute crisis, please contact Tele-MANAS (14416) or emergency services (112) immediately.'
  });
});

// ==========================================
// Student-Protected Endpoints
// ==========================================

// Trusted Adult / Emergency Contact
router.get('/trusted-adult', requireRole('student'), (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const user = req.rawUser || req.user;
  res.json({
    trustedAdult: user?.emergencyContact || null,
    info: 'Your trusted adult contact is notified only if you explicitly choose to connect or in situations of severe, immediate life-safety emergencies in accordance with our transparent safeguarding protocol.'
  });
});

router.post('/trusted-adult', requireRole('student'), (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { name, relation, phone, email, notifyOnCrisis } = req.body || {};
  const user = req.rawUser || USERS.find(u => u.id === key);
  if (user) {
    user.emergencyContact = {
      name,
      relation,
      phone,
      email,
      notifyOnCrisis: Boolean(notifyOnCrisis)
    };
    AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorRole: 'student',
      actorName: user.name,
      action: 'TRUSTED_ADULT_UPDATED',
      details: `Designated ${relation} (${name}) as emergency trusted adult.`
    });
    return res.json({ success: true, emergencyContact: user.emergencyContact });
  }
  res.status(404).json({ error: 'User not found' });
});

// Counsellor Booking Requests
router.get('/requests', requireRole('student'), (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const studentRequests = CONSULTATION_REQUESTS.filter(r => r.studentId === key);
  res.json({ requests: studentRequests });
});

router.post('/book-session', requireRole('student'), (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { counsellorId, reason, preferredSlot } = req.body || {};
  const counsellor = COUNSELLORS.find(c => c.id === counsellorId) || COUNSELLORS[0];
  const student = req.rawUser || req.user;

  const newRequest = {
    id: `req-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    counsellorId: counsellor.id,
    counsellorName: counsellor.name,
    reason: reason || 'Exam anxiety and study balance discussion.',
    preferredSlot: preferredSlot || 'Next available weekday evening',
    status: 'Pending Review',
    createdAt: new Date().toISOString(),
    confidentialNotes: 'Confidential request submitted by student.'
  };

  CONSULTATION_REQUESTS.unshift(newRequest);

  AUDIT_LOGS.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorRole: 'student',
    actorName: student.name,
    action: 'COUNSELLOR_SESSION_REQUESTED',
    details: `Session requested with ${counsellor.name}`
  });

  res.json({ success: true, request: newRequest });
});

// Teacher Contacts
router.get('/teachers', requireRole('student'), (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const teachers = TEACHERS[key] || [];
  res.json({ teachers });
});

router.post('/teachers', requireRole('student'), (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { name, subject, schoolOrCoaching, phone, email, availableHours, notes } = req.body || {};
  if (!TEACHERS[key]) TEACHERS[key] = [];

  const newTch = {
    id: `tch-${Date.now()}`,
    name: name || 'Teacher',
    subject: subject || 'Subject Guide',
    schoolOrCoaching: schoolOrCoaching || '',
    phone: phone || '',
    email: email || '',
    availableHours: availableHours || 'By appointment',
    notes: notes || '',
    isTrustedMentor: true
  };
  TEACHERS[key].push(newTch);
  res.json({ success: true, teacher: newTch });
});

router.delete('/teachers/:id', requireRole('student'), (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const list = TEACHERS[key];
  if (list) {
    const idx = list.findIndex(t => t.id === req.params.id);
    if (idx >= 0) {
      list.splice(idx, 1);
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: 'Teacher contact not found' });
});

export default router;
