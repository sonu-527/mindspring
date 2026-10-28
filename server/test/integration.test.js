import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// Ensure test environment suppresses background server startup and request logging
process.env.NODE_ENV = 'test';

// Dynamic import so process.env.NODE_ENV is set before src/index.js evaluates
const { default: app } = await import('../src/index.js');
const { USERS, TODO_TASKS, PRIVATE_JOURNAL } = await import('../src/db/store.js');

describe('MindSpring Backend API Integration Tests', () => {
  let server;
  let baseUrl;

  let activeCookie = null;

  before(async () => {
    server = createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Explicit demo bootstrap to establish initial student-1 session
    const bootRes = await fetch(`${baseUrl}/api/auth/demo-bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': baseUrl
      },
      body: JSON.stringify({ userId: 'student-1' })
    });
    const setCookie = bootRes.headers.get('set-cookie');
    if (setCookie) {
      activeCookie = setCookie.split(';')[0];
    }
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // Helper for JSON requests
  async function apiRequest(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      ...(activeCookie ? { 'Cookie': activeCookie } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(url, {
      ...options,
      headers
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      activeCookie = setCookie.split(';')[0];
    }
    const contentType = res.headers.get('content-type') || '';
    let body = null;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    return { status: res.status, ok: res.ok, body, headers: res.headers };
  }

  // ==========================================
  // 1. Health & System
  // ==========================================
  describe('System & Health Endpoints', () => {
    it('GET /api/health returns 200 with platform status and AI config flag', async () => {
      const res = await apiRequest('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'healthy');
      assert.ok(res.body.platform.includes('MindSpring'));
      assert.equal(typeof res.body.aiConfigured, 'boolean');
      assert.ok(res.body.timestamp);
    });
  });

  // ==========================================
  // 2. Authentication & User Profiles
  // ==========================================
  describe('Auth & User Routes (/api/auth)', () => {
    it('GET /api/auth/demo-users returns all demo accounts with sanitized fields', async () => {
      const res = await apiRequest('/api/auth/demo-users');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.users));
      assert.ok(res.body.users.length >= 4);
      const student = res.body.users.find(u => u.id === 'student-1');
      assert.ok(student);
      assert.equal(student.role, 'student');
      assert.equal(student.name, 'Aarav Sharma');
    });

    it('GET /api/auth/me returns the currently active user', async () => {
      const res = await apiRequest('/api/auth/me');
      assert.equal(res.status, 200);
      assert.ok(res.body.user);
      assert.ok(res.body.user.id);
      assert.ok(res.body.user.email);
    });

    it('POST /api/auth/login successfully logs in an existing user', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ userId: 'student-2' })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.id, 'student-2');
      assert.equal(res.body.user.name, 'Priya Patel');
    });

    it('POST /api/auth/login returns 404 for unknown user', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ userId: 'non-existent-user-999' })
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'User not found');
    });

    it('POST /api/auth/register registers a new student and sets currentUser', async () => {
      const newEmail = `test.student.${Date.now()}@demo.com`;
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Student',
          email: newEmail,
          ageGroup: '16-18',
          examGoal: 'UPSC CSE 2027',
          parentConsent: true
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, newEmail);
      assert.equal(res.body.user.examGoal, 'UPSC CSE 2027');
      assert.equal(res.body.user.consentGiven, true);
    });

    it('POST /api/auth/register returns 400 when required fields are missing', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Only Name' })
      });
      assert.equal(res.status, 400);
      assert.ok(res.body.error.includes('Name and email are required'));
    });

    it('POST /api/auth/switch-role successfully switches active role', async () => {
      const res = await apiRequest('/api/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'counsellor' })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.role, 'counsellor');
    });

    it('POST /api/auth/switch-role returns 404 for invalid role/user', async () => {
      const res = await apiRequest('/api/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role: 'astronaut', userId: 'unknown-id' })
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Target role/user not found');
    });

    it('POST /api/auth/consent updates consent and emergency contact', async () => {
      // First switch back to student-1
      await apiRequest('/api/auth/switch-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'student-1' })
      });

      const res = await apiRequest('/api/auth/consent', {
        method: 'POST',
        body: JSON.stringify({
          consentGiven: true,
          emergencyContact: {
            name: 'Sunita Sharma',
            relation: 'Mother',
            phone: '+91 98765 43210',
            email: 'sunita.sharma@demo.com',
            notifyOnCrisis: true
          }
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.consentGiven, true);
      assert.equal(res.body.user.emergencyContact.name, 'Sunita Sharma');
    });
  });

  // ==========================================
  // 3. Academic Tasks & To-Do Planner
  // ==========================================
  describe('Academic Tasks Endpoints (/api/academic)', () => {
    let createdTaskId;
    const testDate = '2026-11-15';

    it('GET /api/academic/tasks returns task list for student-1', async () => {
      const res = await apiRequest('/api/academic/tasks?studentId=student-1');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.tasks));
      assert.ok(res.body.tasks.length > 0);
    });

    it('POST /api/academic/tasks creates a new task with priority and category', async () => {
      const res = await apiRequest('/api/academic/tasks', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          title: 'Integration Test Task: Organic Chemistry Recap',
          description: 'Testing task persistence in memory store',
          date: testDate,
          startTime: '14:30',
          priority: 'high',
          category: 'Revision',
          reminderMinutesBefore: 15
        })
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.task.id);
      assert.equal(res.body.task.title, 'Integration Test Task: Organic Chemistry Recap');
      assert.equal(res.body.task.priority, 'high');
      assert.equal(res.body.task.category, 'Revision');
      assert.equal(res.body.task.completed, false);
      createdTaskId = res.body.task.id;
    });

    it('GET /api/academic/tasks filters tasks by date', async () => {
      const res = await apiRequest(`/api/academic/tasks?studentId=student-1&date=${testDate}`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.tasks));
      assert.ok(res.body.tasks.some(t => t.id === createdTaskId));
      assert.ok(res.body.tasks.every(t => t.date === testDate));
    });

    it('GET /api/academic/tasks filters tasks by month', async () => {
      const res = await apiRequest('/api/academic/tasks?studentId=student-1&month=2026-11');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.tasks));
      assert.ok(res.body.tasks.some(t => t.id === createdTaskId));
      assert.ok(res.body.tasks.every(t => t.date.startsWith('2026-11')));
    });

    it('PUT /api/academic/tasks/:id updates an existing task', async () => {
      const res = await apiRequest(`/api/academic/tasks/${createdTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          studentId: 'student-1',
          title: 'Updated Task: Organic Chemistry Advanced',
          priority: 'medium'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.task.title, 'Updated Task: Organic Chemistry Advanced');
      assert.equal(res.body.task.priority, 'medium');
      assert.equal(res.body.task.id, createdTaskId); // preserves ID
    });

    it('PUT /api/academic/tasks/:id returns 404 for non-existent task', async () => {
      const res = await apiRequest('/api/academic/tasks/task-non-existent-9999', {
        method: 'PUT',
        body: JSON.stringify({
          studentId: 'student-1',
          title: 'Does not exist'
        })
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Task not found');
    });

    it('POST /api/academic/tasks/toggle toggles completion status', async () => {
      const res = await apiRequest('/api/academic/tasks/toggle', {
        method: 'POST',
        body: JSON.stringify({
          taskId: createdTaskId,
          studentId: 'student-1'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.task.completed, true);

      // Toggle back to false
      const res2 = await apiRequest('/api/academic/tasks/toggle', {
        method: 'POST',
        body: JSON.stringify({
          taskId: createdTaskId,
          studentId: 'student-1'
        })
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.body.task.completed, false);
    });

    it('POST /api/academic/tasks/toggle returns 404 for non-existent task', async () => {
      const res = await apiRequest('/api/academic/tasks/toggle', {
        method: 'POST',
        body: JSON.stringify({
          taskId: 'task-ghost',
          studentId: 'student-1'
        })
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Task not found');
    });

    it('POST /api/academic/tasks/:id/reschedule updates date and resets notified flag', async () => {
      const newDate = '2026-11-20';
      const res = await apiRequest(`/api/academic/tasks/${createdTaskId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          date: newDate,
          studentId: 'student-1'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.task.date, newDate);
      assert.equal(res.body.task.notified, false);
    });

    it('POST /api/academic/tasks/:id/reschedule returns 404 for invalid taskId', async () => {
      const res = await apiRequest('/api/academic/tasks/task-fake/reschedule', {
        method: 'POST',
        body: JSON.stringify({
          date: '2026-11-25',
          studentId: 'student-1'
        })
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Task not found');
    });

    it('DELETE /api/academic/tasks/:id deletes the task', async () => {
      const res = await apiRequest(`/api/academic/tasks/${createdTaskId}?studentId=student-1`, {
        method: 'DELETE'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify task no longer appears in query
      const checkRes = await apiRequest(`/api/academic/tasks?studentId=student-1&date=2026-11-20`);
      assert.ok(!checkRes.body.tasks.some(t => t.id === createdTaskId));
    });

    it('DELETE /api/academic/tasks/:id returns 404 when task does not exist', async () => {
      const res = await apiRequest('/api/academic/tasks/task-non-existent-999?studentId=student-1', {
        method: 'DELETE'
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Task not found');
    });

    it('GET & POST /api/academic/mock-tests manages mock test records', async () => {
      const getRes = await apiRequest('/api/academic/mock-tests?studentId=student-1');
      assert.equal(getRes.status, 200);
      assert.ok(Array.isArray(getRes.body.tests));

      const postRes = await apiRequest('/api/academic/mock-tests', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          title: 'JEE Advanced Full Mock #5',
          score: 245,
          totalMarks: 360,
          percentile: 98.7,
          rank: 110,
          notes: 'Great physics performance'
        })
      });
      assert.equal(postRes.status, 200);
      assert.equal(postRes.body.success, true);
      assert.equal(postRes.body.test.title, 'JEE Advanced Full Mock #5');
      assert.equal(postRes.body.test.score, 245);
    });

    it('GET & POST /api/academic/mistakes and toggle review state', async () => {
      const postRes = await apiRequest('/api/academic/mistakes', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          subject: 'Mathematics',
          topic: 'Differential Equations',
          errorType: 'Calculation Mistake',
          description: 'Missed integrating factor sign',
          solutionKey: 'e^(int P dx) requires keeping negative sign'
        })
      });
      assert.equal(postRes.status, 200);
      assert.ok(postRes.body.mistake.id);
      const mId = postRes.body.mistake.id;

      const toggleRes = await apiRequest('/api/academic/mistakes/toggle', {
        method: 'POST',
        body: JSON.stringify({ mistakeId: mId, studentId: 'student-1' })
      });
      assert.equal(toggleRes.status, 200);
      assert.equal(toggleRes.body.item.reviewed, true);

      // 404 check
      const failToggle = await apiRequest('/api/academic/mistakes/toggle', {
        method: 'POST',
        body: JSON.stringify({ mistakeId: 'err-fake', studentId: 'student-1' })
      });
      assert.equal(failToggle.status, 404);
    });

    it('GET & POST /api/academic/backlogs and toggle completed state', async () => {
      const postRes = await apiRequest('/api/academic/backlogs', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          subject: 'Physics',
          chapter: 'Thermodynamics Carnot Cycle',
          urgency: 'High',
          estimatedHours: 3
        })
      });
      assert.equal(postRes.status, 200);
      const bId = postRes.body.backlog.id;

      const toggleRes = await apiRequest('/api/academic/backlogs/toggle', {
        method: 'POST',
        body: JSON.stringify({ backlogId: bId, studentId: 'student-1' })
      });
      assert.equal(toggleRes.status, 200);
      assert.equal(toggleRes.body.item.completed, true);

      // 404 check
      const failToggle = await apiRequest('/api/academic/backlogs/toggle', {
        method: 'POST',
        body: JSON.stringify({ backlogId: 'bg-fake', studentId: 'student-1' })
      });
      assert.equal(failToggle.status, 404);
    });

    it('GET /api/academic/revision returns scheduled revision items', async () => {
      const res = await apiRequest('/api/academic/revision?studentId=student-1');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.revisionSchedule));
      assert.ok(res.body.revisionSchedule.length > 0);
    });
  });

  // ==========================================
  // 4. Wellbeing, Mood & Private Journal
  // ==========================================
  describe('Wellbeing & Emotional Health (/api/wellbeing)', () => {
    let createdJournalId;

    it('GET /api/wellbeing/assessment returns assessments and non-diagnostic disclaimer', async () => {
      const res = await apiRequest('/api/wellbeing/assessment?studentId=student-1');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.assessments));
      assert.ok(res.body.disclaimer.includes('non-diagnostic'));
    });

    it('POST /api/wellbeing/assessment calculates normalized 0-100 index', async () => {
      const res = await apiRequest('/api/wellbeing/assessment', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          mood: 4,
          stress: 2,
          sleep: 4,
          energy: 4,
          socialConnection: 4,
          academicPressure: 2,
          supportAccess: 4,
          reflectionNotes: 'Feeling balanced after adequate rest'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.assessment.overallIndex === 'number');
      // posScore = 4+4+4+4+4 = 20, negScore = 2+2 = 4 -> (20*2) + (12-4)*3 = 64
      assert.equal(res.body.assessment.overallIndex, 64);
      assert.equal(res.body.assessment.consultationSuggested, false);
      assert.ok(res.body.assessment.summaryFeedback);
      assert.ok(res.body.assessment.recommendation);
    });

    it('POST /api/wellbeing/assessment flags consultationSuggested on severe distress scores', async () => {
      const res = await apiRequest('/api/wellbeing/assessment', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          mood: 1,
          stress: 5,
          sleep: 1,
          energy: 1,
          socialConnection: 1,
          academicPressure: 5,
          supportAccess: 1,
          reflectionNotes: 'Exhausted and overwhelmed by tests'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.assessment.consultationSuggested, true);
      assert.ok(res.body.assessment.overallIndex < 50);
      assert.ok(res.body.assessment.recommendation.includes('counsellor'));
    });

    it('GET & POST /api/wellbeing/mood logs daily emotional status', async () => {
      const postRes = await apiRequest('/api/wellbeing/mood', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          mood: 'Peaceful',
          level: 4,
          energy: 4,
          note: 'Completed 60s breathing and quiet walk',
          tags: ['Grounded', 'Calm']
        })
      });
      assert.equal(postRes.status, 200);
      assert.equal(postRes.body.success, true);
      assert.equal(postRes.body.mood.mood, 'Peaceful');

      const getRes = await apiRequest('/api/wellbeing/mood?studentId=student-1');
      assert.equal(getRes.status, 200);
      assert.ok(Array.isArray(getRes.body.moodHistory));
      assert.equal(getRes.body.moodHistory[0].mood, 'Peaceful');
    });

    it('POST /api/wellbeing/journal creates private student journal entry', async () => {
      const res = await apiRequest('/api/wellbeing/journal', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          title: 'Integration Test Reflection',
          content: 'I realized my self-worth is not tied to a single mock test score.',
          tags: ['Perspective', 'Self-Compassion'],
          mood: 'Calm'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.entry.id);
      assert.equal(res.body.entry.title, 'Integration Test Reflection');
      createdJournalId = res.body.entry.id;
    });

    it('GET /api/wellbeing/journal returns entries and privacy reassurance', async () => {
      const res = await apiRequest('/api/wellbeing/journal?studentId=student-1');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.entries));
      assert.ok(res.body.entries.some(e => e.id === createdJournalId));
      assert.ok(res.body.privacyNotice.includes('strictly private'));
    });

    it('DELETE /api/wellbeing/journal/:id deletes private journal entry', async () => {
      const res = await apiRequest(`/api/wellbeing/journal/${createdJournalId}?studentId=student-1`, {
        method: 'DELETE'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.message.includes('removed'));

      // 404 check
      const failRes = await apiRequest('/api/wellbeing/journal/jr-fake-id?studentId=student-1', {
        method: 'DELETE'
      });
      assert.equal(failRes.status, 404);
      assert.equal(failRes.body.error, 'Entry not found');
    });
  });

  // ==========================================
  // 5. Support Circle, Counsellors & Teachers
  // ==========================================
  describe('Support Circle & Mentors (/api/support)', () => {
    let createdTeacherId;

    it('GET /api/support/trusted-adult returns designated emergency contact', async () => {
      const res = await apiRequest('/api/support/trusted-adult?studentId=student-1');
      assert.equal(res.status, 200);
      assert.ok(res.body.trustedAdult);
      assert.equal(res.body.trustedAdult.name, 'Sunita Sharma');
      assert.ok(res.body.info);
    });

    it('POST /api/support/trusted-adult updates designated adult info', async () => {
      const res = await apiRequest('/api/support/trusted-adult?studentId=student-1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sunita Sharma',
          relation: 'Mother',
          phone: '+91 98765 43210',
          email: 'sunita.updated@demo.com',
          notifyOnCrisis: true
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.emergencyContact.email, 'sunita.updated@demo.com');
    });

    it('POST /api/support/trusted-adult returns 404 for unknown user', async () => {
      const res = await apiRequest('/api/support/trusted-adult?studentId=unknown-student-404', {
        method: 'POST',
        body: JSON.stringify({ name: 'Someone' })
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'User not found');
    });

    it('GET /api/support/counsellors returns verified professionals', async () => {
      const res = await apiRequest('/api/support/counsellors');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.counsellors));
      assert.ok(res.body.counsellors.length >= 2);
      assert.ok(res.body.notice.includes('qualified mental health professionals'));
    });

    it('POST /api/support/book-session schedules a consultation request', async () => {
      const res = await apiRequest('/api/support/book-session', {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-1',
          counsellorId: 'coun-1',
          reason: 'Pacing anxiety during 3-hour tests',
          preferredSlot: 'Friday 4:30 PM'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.request.id);
      assert.equal(res.body.request.status, 'Pending Review');
      assert.equal(res.body.request.counsellorName, 'Dr. Ananya Roy');
    });

    it('GET /api/support/requests returns student-specific bookings', async () => {
      const res = await apiRequest('/api/support/requests?studentId=student-1');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.requests));
      assert.ok(res.body.requests.some(r => r.reason.includes('Pacing anxiety')));
    });

    it('GET /api/support/crisis-helplines returns verified Indian helplines', async () => {
      const res = await apiRequest('/api/support/crisis-helplines');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.helplines));
      assert.ok(res.body.helplines.some(h => h.number.includes('14416'))); // Tele-MANAS
      assert.ok(res.body.helplines.some(h => h.name.includes('KIRAN')));
      assert.ok(res.body.safeguardingDisclaimer.includes('non-clinical'));
    });

    it('GET & POST /api/support/teachers adds a new teacher mentor', async () => {
      const postRes = await apiRequest('/api/support/teachers', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Prof. Ramesh Gupta',
          subject: 'Organic Chemistry',
          schoolOrCoaching: 'Allen Kota Advanced Batch',
          phone: '+91 98450 11223',
          email: 'ramesh.gupta@faculty.demo',
          availableHours: 'Mon & Wed 5 PM - 6:30 PM',
          notes: 'Helpful for reaction mechanism doubts.'
        })
      });
      assert.equal(postRes.status, 200);
      assert.equal(postRes.body.success, true);
      assert.equal(postRes.body.teacher.name, 'Prof. Ramesh Gupta');
      assert.equal(postRes.body.teacher.isTrustedMentor, true);
      createdTeacherId = postRes.body.teacher.id;

      const getRes = await apiRequest('/api/support/teachers');
      assert.equal(getRes.status, 200);
      assert.ok(Array.isArray(getRes.body.teachers));
      assert.ok(getRes.body.teachers.some(t => t.id === createdTeacherId));
    });

    it('DELETE /api/support/teachers/:id removes teacher mentor', async () => {
      const res = await apiRequest(`/api/support/teachers/${createdTeacherId}`, {
        method: 'DELETE'
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // 404 check
      const failRes = await apiRequest('/api/support/teachers/tch-fake-id', {
        method: 'DELETE'
      });
      assert.equal(failRes.status, 404);
      assert.equal(failRes.body.error, 'Teacher contact not found');
    });
  });

  // ==========================================
  // 6. AI Companion & Safety Guardrails
  // ==========================================
  describe('AI Companion & Safety Service (/api/companion)', () => {
    it('GET /api/companion/characters returns character profiles including CR7 and Mickey', async () => {
      const res = await apiRequest('/api/companion/characters');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.characters));
      assert.ok(res.body.characters.some(c => c.id === 'champion_ronaldo'));
      assert.ok(res.body.characters.some(c => c.id === 'mickey_pal'));
      assert.ok(res.body.characters.some(c => c.id === 'anime_sensei'));
    });

    it('GET /api/companion/goals returns conversation goals', async () => {
      const res = await apiRequest('/api/companion/goals');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.goals));
      assert.ok(res.body.goals.some(g => g.id === 'exam_stress'));
      assert.ok(res.body.goals.some(g => g.id === 'burnout'));
    });

    it('GET /api/companion/starters returns contextual conversation starters', async () => {
      const res = await apiRequest('/api/companion/starters?goal=exam_stress');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.starters));
      assert.ok(res.body.starters.length > 0);
    });

    it('POST /api/companion/chat returns 400 when message is empty or missing', async () => {
      const res = await apiRequest('/api/companion/chat', {
        method: 'POST',
        body: JSON.stringify({ characterId: 'supportive_mentor' })
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Message content is required.');
    });

    it('POST /api/companion/chat provides offline empathetic reply without external API call', async () => {
      const res = await apiRequest('/api/companion/chat', {
        method: 'POST',
        body: JSON.stringify({
          characterId: 'champion_ronaldo',
          goal: 'motivation',
          message: 'I scored lower than expected on my mock test',
          history: []
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.isCrisis, false);
      assert.ok(res.body.reply);
      assert.ok(res.body.reply.includes('champion') || res.body.reply.includes('Siuuu'));
      assert.ok(res.body.reply.includes('Mock tests are diagnostic thermometers'));
      assert.ok(res.body.poweredBy);
    });

    it('POST /api/companion/chat triggers immediate crisis override on self-harm input', async () => {
      const res = await apiRequest('/api/companion/chat', {
        method: 'POST',
        body: JSON.stringify({
          characterId: 'supportive_mentor',
          goal: 'exam_stress',
          message: 'The pressure is too much, I want to kill myself',
          history: []
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.isCrisis, true);
      assert.ok(res.body.reply.includes('Tele-MANAS'));
      assert.ok(Array.isArray(res.body.helplines));
      assert.ok(res.body.helplines.length > 0);
      assert.equal(res.body.helplines[0].number, '14416 / 1800-891-4416');
    });
  });

  // ==========================================
  // 7. Role-Specific Dashboards
  // ==========================================
  describe('Role Dashboards (/api/dashboards)', () => {
    it('GET /api/dashboards/parent returns child progress and parent support tips', async () => {
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'parent' }) });
      const res = await apiRequest('/api/dashboards/parent');
      assert.equal(res.status, 200);
      assert.ok(res.body.parentName);
      assert.ok(res.body.student);
      assert.ok(res.body.student.examGoal);
      assert.ok(res.body.privacyNotice.includes('confidential'));
      assert.ok(Array.isArray(res.body.parentSupportGuide));
    });

    it('GET /api/dashboards/counsellor returns triage requests and clinical guidelines', async () => {
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'counsellor' }) });
      const res = await apiRequest('/api/dashboards/counsellor');
      assert.equal(res.status, 200);
      assert.ok(res.body.counsellor);
      assert.ok(Array.isArray(res.body.triageQueue));
      assert.ok(Array.isArray(res.body.guidelines));
    });

    it('GET /api/dashboards/admin returns health, user count, and compliance info', async () => {
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'admin' }) });
      const res = await apiRequest('/api/dashboards/admin');
      assert.equal(res.status, 200);
      assert.equal(res.body.systemHealth, 'Optimal');
      assert.ok(res.body.activeUsersCount > 0);
      assert.ok(Array.isArray(res.body.auditLogs));
      assert.equal(res.body.compliance.dpdpActCompliant, true);
    });
  });

  // ==========================================
  // 8. Security & Authorization Verification Tests
  // ==========================================
  describe('Security & Multi-Tenant Authorization Verification', () => {
    it('VERIFIED SECURITY: Authenticated student can access only their own private journal', async () => {
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-1' }) });
      const res = await apiRequest('/api/wellbeing/journal?studentId=student-1');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.entries));
      assert.ok(res.body.entries.length > 0);

      // Cross-tenant access is rejected with 403
      const crossRes = await apiRequest('/api/wellbeing/journal?studentId=student-2');
      assert.equal(crossRes.status, 403);
    });

    it('VERIFIED SECURITY: Authenticated students can access only their own tasks and moods', async () => {
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-2' }) });
      const taskRes = await apiRequest('/api/academic/tasks?studentId=student-2');
      assert.equal(taskRes.status, 200);
      assert.ok(Array.isArray(taskRes.body.tasks));

      // student-2 cannot access student-1 tasks
      const crossTaskRes = await apiRequest('/api/academic/tasks?studentId=student-1');
      assert.equal(crossTaskRes.status, 403);

      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-1' }) });
      const moodRes = await apiRequest('/api/wellbeing/mood?studentId=student-1');
      assert.equal(moodRes.status, 200);
      assert.ok(Array.isArray(moodRes.body.moodHistory));

      // student-1 cannot access student-2 moods
      const crossMoodRes = await apiRequest('/api/wellbeing/mood?studentId=student-2');
      assert.equal(crossMoodRes.status, 403);
    });

    it('VERIFIED SECURITY: Calling POST /api/auth/consent mutates only the authenticated user session', async () => {
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-1' }) });
      // Mutate consent
      await apiRequest('/api/auth/consent', {
        method: 'POST',
        body: JSON.stringify({ consentGiven: false })
      });

      // Subsequent /api/auth/me reflects the mutation for authenticated caller student-1
      const meRes = await apiRequest('/api/auth/me');
      assert.equal(meRes.status, 200);
      assert.equal(meRes.body.user.consentGiven, false);

      // student-2's consent remains untouched (true)
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-2' }) });
      const student2MeRes = await apiRequest('/api/auth/me');
      assert.equal(student2MeRes.status, 200);
      assert.equal(student2MeRes.body.user.consentGiven, true);

      // Switch back to student-1 and revert for consistency
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-1' }) });
      await apiRequest('/api/auth/consent', {
        method: 'POST',
        body: JSON.stringify({ consentGiven: true })
      });
      const revertMeRes = await apiRequest('/api/auth/me');
      assert.equal(revertMeRes.status, 200);
      assert.equal(revertMeRes.body.user.consentGiven, true);
    });
  });

  // ==========================================
  // 9. Data Architecture: TEACHERS Array Per-Student Isolation Regression Tests
  // ==========================================
  describe('TEACHERS Array Per-Student Isolation Regression Tests', () => {
    it('REGRESSION: store.js exports TEACHERS keyed by studentId', async () => {
      const storeExports = await import('../src/db/store.js');
      assert.ok(storeExports.TEACHERS, 'store.js must export TEACHERS');
      assert.equal(typeof storeExports.TEACHERS, 'object');
      assert.ok(Array.isArray(storeExports.TEACHERS['student-1']));
      assert.ok(storeExports.TEACHERS['student-1'].length >= 2);
    });

    it('REGRESSION: student-1 cannot see, modify, or delete student-2 teacher contacts', async () => {
      // 1. Initially student-2 has empty or distinct teachers list
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-2' }) });
      const resStudent2Init = await apiRequest('/api/support/teachers?studentId=student-2');
      assert.equal(resStudent2Init.status, 200);
      assert.ok(Array.isArray(resStudent2Init.body.teachers));
      const initCountStudent2 = resStudent2Init.body.teachers.length;

      // student-1 has pre-seeded teachers (Prof. Vikram Sen, Mrs. Geeta Krishnan)
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-1' }) });
      const resStudent1 = await apiRequest('/api/support/teachers?studentId=student-1');
      assert.ok(resStudent1.body.teachers.length >= 2);
      assert.notDeepEqual(resStudent1.body.teachers, resStudent2Init.body.teachers);

      // 2. student-2 adds a personal mentor
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-2' }) });
      const addRes = await apiRequest('/api/support/teachers?studentId=student-2', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Dr. Neha Verma (NEET Biology Guide)',
          subject: 'Biology'
        })
      });
      assert.equal(addRes.status, 200);
      assert.equal(addRes.body.success, true);
      const student2TeacherId = addRes.body.teacher.id;

      // 3. student-2 sees their new mentor
      const checkStudent2 = await apiRequest('/api/support/teachers?studentId=student-2');
      assert.ok(checkStudent2.body.teachers.some(t => t.id === student2TeacherId));

      // 4. student-1 CANNOT see student-2's mentor
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-1' }) });
      const checkStudent1 = await apiRequest('/api/support/teachers?studentId=student-1');
      assert.ok(!checkStudent1.body.teachers.some(t => t.id === student2TeacherId));

      // 5. student-1 CANNOT delete student-2's mentor (returns 404)
      const failDeleteRes = await apiRequest(`/api/support/teachers/${student2TeacherId}?studentId=student-1`, {
        method: 'DELETE'
      });
      assert.equal(failDeleteRes.status, 404);
      assert.equal(failDeleteRes.body.error, 'Teacher contact not found');

      // 6. student-2 can successfully delete their own mentor
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-2' }) });
      const successDeleteRes = await apiRequest(`/api/support/teachers/${student2TeacherId}?studentId=student-2`, {
        method: 'DELETE'
      });
      assert.equal(successDeleteRes.status, 200);
      assert.equal(successDeleteRes.body.success, true);

      // Verify deletion from student-2 list
      const finalStudent2 = await apiRequest('/api/support/teachers?studentId=student-2');
      assert.ok(!finalStudent2.body.teachers.some(t => t.id === student2TeacherId));

      // Reset back to student-1
      await apiRequest('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ userId: 'student-1' }) });
    });
  });
});
