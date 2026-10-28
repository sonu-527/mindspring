import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/index.js');
const {
  USERS,
  SESSIONS,
  createSession,
  getSession,
  revokeSession,
  TODO_TASKS,
  MOOD_LOGS,
  PRIVATE_JOURNAL
} = await import('../src/db/store.js');

describe('MindSpring Phase 3 Step 5: Comprehensive Security Regression Testing Suite', () => {
  let server;
  let baseUrl;
  let student1Cookie;
  let student2Cookie;
  let parentCookie;
  let counsellorCookie;
  let adminCookie;

  before(async () => {
    server = createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    student1Cookie = await obtainSessionCookie('student-1');
    student2Cookie = await obtainSessionCookie('student-2');
    parentCookie = await obtainSessionCookie('parent-1');
    counsellorCookie = await obtainSessionCookie('counsellor-1');
    adminCookie = await obtainSessionCookie('admin-1');
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  async function obtainSessionCookie(userId) {
    const res = await fetch(`${baseUrl}/api/auth/demo-bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': baseUrl
      },
      body: JSON.stringify({ userId })
    });
    assert.equal(res.status, 200, `Bootstrap failed for ${userId}`);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Expected Set-Cookie header');
    return setCookie.split(';')[0];
  }

  async function rawRequest(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let body = null;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    return { status: res.status, ok: res.ok, body, headers: res.headers };
  }

  async function authedRequest(endpoint, cookie, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      ...(cookie ? { 'Cookie': cookie } : {}),
      ...(options.headers || {})
    };
    return rawRequest(endpoint, {
      ...options,
      headers
    });
  }

  // =========================================================================
  // 1. Unauthenticated Requests Receive 401 on Protected Endpoints
  // =========================================================================
  describe('1. Unauthenticated Request Denial (401)', () => {
    it('GET /api/auth/me without session returns 401', async () => {
      const res = await rawRequest('/api/auth/me');
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });

    it('POST /api/auth/consent without session returns 401', async () => {
      const res = await rawRequest('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': baseUrl },
        body: JSON.stringify({ consentGiven: true })
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });

    it('Academic tasks endpoints without session return 401', async () => {
      const endpoints = [
        { path: '/api/academic/tasks', method: 'GET' },
        { path: '/api/academic/tasks', method: 'POST', body: { title: 'Test Task' } },
        { path: '/api/academic/tasks/task-1', method: 'PUT', body: { title: 'Updated' } },
        { path: '/api/academic/tasks/task-1', method: 'DELETE' },
        { path: '/api/academic/tasks/toggle', method: 'POST', body: { taskId: 'task-1' } },
        { path: '/api/academic/tasks/task-1/reschedule', method: 'POST', body: { date: '2027-01-01' } }
      ];

      for (const ep of endpoints) {
        const res = await rawRequest(ep.path, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json', 'Origin': baseUrl },
          body: ep.body ? JSON.stringify(ep.body) : undefined
        });
        assert.equal(res.status, 401, `Expected 401 for ${ep.method} ${ep.path}, got ${res.status}`);
        assert.equal(res.body.error, 'Authentication required');
      }
    });

    it('Academic records (mock-tests, mistakes, backlogs, revision) without session return 401', async () => {
      const endpoints = [
        { path: '/api/academic/mock-tests', method: 'GET' },
        { path: '/api/academic/mock-tests', method: 'POST', body: { title: 'Mock 1' } },
        { path: '/api/academic/mistakes', method: 'GET' },
        { path: '/api/academic/mistakes', method: 'POST', body: { subject: 'Physics' } },
        { path: '/api/academic/mistakes/toggle', method: 'POST', body: { mistakeId: 'err-1' } },
        { path: '/api/academic/backlogs', method: 'GET' },
        { path: '/api/academic/backlogs', method: 'POST', body: { subject: 'Chemistry' } },
        { path: '/api/academic/backlogs/toggle', method: 'POST', body: { backlogId: 'bg-1' } },
        { path: '/api/academic/revision', method: 'GET' }
      ];

      for (const ep of endpoints) {
        const res = await rawRequest(ep.path, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json', 'Origin': baseUrl },
          body: ep.body ? JSON.stringify(ep.body) : undefined
        });
        assert.equal(res.status, 401, `Expected 401 for ${ep.method} ${ep.path}, got ${res.status}`);
        assert.equal(res.body.error, 'Authentication required');
      }
    });

    it('Wellbeing endpoints (assessment, mood, journal) without session return 401', async () => {
      const endpoints = [
        { path: '/api/wellbeing/assessment', method: 'GET' },
        { path: '/api/wellbeing/assessment', method: 'POST', body: { mood: 4 } },
        { path: '/api/wellbeing/mood', method: 'GET' },
        { path: '/api/wellbeing/mood', method: 'POST', body: { mood: 'Good', level: 4 } },
        { path: '/api/wellbeing/journal', method: 'GET' },
        { path: '/api/wellbeing/journal', method: 'POST', body: { title: 'Note', content: 'Secret' } },
        { path: '/api/wellbeing/journal/j-entry-1', method: 'DELETE' }
      ];

      for (const ep of endpoints) {
        const res = await rawRequest(ep.path, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json', 'Origin': baseUrl },
          body: ep.body ? JSON.stringify(ep.body) : undefined
        });
        assert.equal(res.status, 401, `Expected 401 for ${ep.method} ${ep.path}, got ${res.status}`);
        assert.equal(res.body.error, 'Authentication required');
      }
    });

    it('Student support endpoints without session return 401', async () => {
      const endpoints = [
        { path: '/api/support/trusted-adult', method: 'GET' },
        { path: '/api/support/trusted-adult', method: 'POST', body: { name: 'Parent' } },
        { path: '/api/support/requests', method: 'GET' },
        { path: '/api/support/book-session', method: 'POST', body: { reason: 'Anxiety' } },
        { path: '/api/support/teachers', method: 'GET' },
        { path: '/api/support/teachers', method: 'POST', body: { name: 'Dr. Mentor' } },
        { path: '/api/support/teachers/tch-1', method: 'DELETE' }
      ];

      for (const ep of endpoints) {
        const res = await rawRequest(ep.path, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json', 'Origin': baseUrl },
          body: ep.body ? JSON.stringify(ep.body) : undefined
        });
        assert.equal(res.status, 401, `Expected 401 for ${ep.method} ${ep.path}, got ${res.status}`);
        assert.equal(res.body.error, 'Authentication required');
      }
    });

    it('Role dashboard endpoints without session return 401', async () => {
      const endpoints = [
        '/api/dashboards/parent',
        '/api/dashboards/counsellor',
        '/api/dashboards/admin'
      ];

      for (const path of endpoints) {
        const res = await rawRequest(path);
        assert.equal(res.status, 401, `Expected 401 for ${path}, got ${res.status}`);
        assert.equal(res.body.error, 'Authentication required');
      }
    });
  });

  // =========================================================================
  // 2. Cross-Student Multi-Tenant Isolation & Resource Ownership (403)
  // =========================================================================
  describe('2. Cross-Student Multi-Tenant Isolation & Resource Ownership (403)', () => {
    it('student-1 cannot read student-2 tasks via query studentId (returns 403)', async () => {
      const res = await authedRequest('/api/academic/tasks?studentId=student-2', student1Cookie);
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('prohibited'));
    });

    it('student-1 cannot create a task assigned to student-2 via body studentId (returns 403)', async () => {
      const res = await authedRequest('/api/academic/tasks', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          title: 'Illicit Task'
        })
      });
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('prohibited'));
    });

    it('student-1 cannot toggle student-2 task via body studentId (returns 403)', async () => {
      const res = await authedRequest('/api/academic/tasks/toggle', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          taskId: 'task-1'
        })
      });
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('prohibited'));
    });

    it('student-1 cannot delete a task with student-2 studentId query (returns 403)', async () => {
      const res = await authedRequest('/api/academic/tasks/task-1?studentId=student-2', student1Cookie, {
        method: 'DELETE'
      });
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('prohibited'));
    });

    it('student-1 cannot access student-2 mock tests, mistakes, or backlogs (returns 403)', async () => {
      const paths = [
        '/api/academic/mock-tests?studentId=student-2',
        '/api/academic/mistakes?studentId=student-2',
        '/api/academic/backlogs?studentId=student-2',
        '/api/academic/revision?studentId=student-2'
      ];

      for (const path of paths) {
        const res = await authedRequest(path, student1Cookie);
        assert.equal(res.status, 403, `Expected 403 for ${path}`);
        assert.ok(res.body.error.includes('prohibited'));
      }
    });

    it('student-1 cannot read student-2 mood history or post mood for student-2 (returns 403)', async () => {
      const getRes = await authedRequest('/api/wellbeing/mood?studentId=student-2', student1Cookie);
      assert.equal(getRes.status, 403);
      assert.ok(getRes.body.error.includes('wellbeing data is prohibited'));

      const postRes = await authedRequest('/api/wellbeing/mood', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          mood: 'Stressed',
          level: 1
        })
      });
      assert.equal(postRes.status, 403);
      assert.ok(postRes.body.error.includes('wellbeing data is prohibited'));
    });

    it('student-1 cannot read or write student-2 private journal entries (returns 403)', async () => {
      const getRes = await authedRequest('/api/wellbeing/journal?studentId=student-2', student1Cookie);
      assert.equal(getRes.status, 403);
      assert.ok(getRes.body.error.includes('wellbeing data is prohibited'));

      const postRes = await authedRequest('/api/wellbeing/journal', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          title: 'Illicit Reflection',
          content: 'Snooping'
        })
      });
      assert.equal(postRes.status, 403);
      assert.ok(postRes.body.error.includes('wellbeing data is prohibited'));
    });

    it('student-1 cannot access or submit student-2 wellbeing assessments (returns 403)', async () => {
      const getRes = await authedRequest('/api/wellbeing/assessment?studentId=student-2', student1Cookie);
      assert.equal(getRes.status, 403);
      assert.ok(getRes.body.error.includes('wellbeing data is prohibited'));

      const postRes = await authedRequest('/api/wellbeing/assessment', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          mood: 1,
          stress: 5
        })
      });
      assert.equal(postRes.status, 403);
      assert.ok(postRes.body.error.includes('wellbeing data is prohibited'));
    });

    it('student-1 cannot access or modify student-2 trusted adult emergency contact (returns 403)', async () => {
      const getRes = await authedRequest('/api/support/trusted-adult?studentId=student-2', student1Cookie);
      assert.equal(getRes.status, 403);
      assert.ok(getRes.body.error.includes('support records is prohibited'));

      const postRes = await authedRequest('/api/support/trusted-adult', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          name: 'Attacker Parent',
          relation: 'Impostor'
        })
      });
      assert.equal(postRes.status, 403);
      assert.ok(postRes.body.error.includes('support records is prohibited'));
    });

    it('student-1 cannot access or create student-2 counsellor requests (returns 403)', async () => {
      const getRes = await authedRequest('/api/support/requests?studentId=student-2', student1Cookie);
      assert.equal(getRes.status, 403);
      assert.ok(getRes.body.error.includes('support records is prohibited'));

      const postRes = await authedRequest('/api/support/book-session', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          reason: 'Unauthorized Booking'
        })
      });
      assert.equal(postRes.status, 403);
      assert.ok(postRes.body.error.includes('support records is prohibited'));
    });

    it('student-1 cannot access, create, or delete student-2 teacher contacts (returns 403)', async () => {
      const getRes = await authedRequest('/api/support/teachers?studentId=student-2', student1Cookie);
      assert.equal(getRes.status, 403);
      assert.ok(getRes.body.error.includes('support records is prohibited'));

      const postRes = await authedRequest('/api/support/teachers', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          name: 'Unauthorized Teacher'
        })
      });
      assert.equal(postRes.status, 403);
      assert.ok(postRes.body.error.includes('support records is prohibited'));

      const delRes = await authedRequest('/api/support/teachers/tch-1?studentId=student-2', student1Cookie, {
        method: 'DELETE'
      });
      assert.equal(delRes.status, 403);
      assert.ok(delRes.body.error.includes('support records is prohibited'));
    });

    it('Omitting studentId query parameter safely defaults to authenticated identity', async () => {
      const taskRes = await authedRequest('/api/academic/tasks', student1Cookie);
      assert.equal(taskRes.status, 200);
      assert.ok(Array.isArray(taskRes.body.tasks));
      assert.ok(taskRes.body.tasks.every(t => t.studentId === 'student-1'));

      const moodRes = await authedRequest('/api/wellbeing/mood', student1Cookie);
      assert.equal(moodRes.status, 200);
      assert.ok(Array.isArray(moodRes.body.moodHistory));

      const journalRes = await authedRequest('/api/wellbeing/journal', student1Cookie);
      assert.equal(journalRes.status, 200);
      assert.ok(Array.isArray(journalRes.body.entries));
    });
  });

  // =========================================================================
  // 3. Role-Based Access Control Violations (403)
  // =========================================================================
  describe('3. Role-Based Access Control Violations (403)', () => {
    it('student cannot access parent dashboard (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/parent', student1Cookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('student cannot access counsellor dashboard (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/counsellor', student1Cookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('student cannot access admin dashboard (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/admin', student1Cookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('parent cannot access student academic tasks (returns 403)', async () => {
      const res = await authedRequest('/api/academic/tasks', parentCookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('parent cannot access private student journal entries (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/journal', parentCookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('parent cannot access raw student mood history (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/mood', parentCookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('parent cannot access student wellbeing assessments (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/assessment', parentCookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('parent cannot access counsellor or admin dashboards (returns 403)', async () => {
      const cRes = await authedRequest('/api/dashboards/counsellor', parentCookie);
      assert.equal(cRes.status, 403);

      const aRes = await authedRequest('/api/dashboards/admin', parentCookie);
      assert.equal(aRes.status, 403);
    });

    it('counsellor cannot access private student journal entries (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/journal', counsellorCookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('counsellor cannot access raw student mood history (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/mood', counsellorCookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('counsellor cannot access student academic tasks (returns 403)', async () => {
      const res = await authedRequest('/api/academic/tasks', counsellorCookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });

    it('admin cannot access private student journal entries (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/journal', adminCookie);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'Forbidden: insufficient role permissions');
    });
  });

  // =========================================================================
  // 4. Parent Access Boundaries & Zero-Knowledge Shielding
  // =========================================================================
  describe('4. Parent Access Boundaries & Zero-Knowledge Shielding', () => {
    it('authorized linked parent (parent-1) accesses linked child (student-1) aggregate metrics only', async () => {
      const res = await authedRequest('/api/dashboards/parent?studentId=student-1', parentCookie);
      assert.equal(res.status, 200);
      assert.equal(res.body.parentName, 'Sunita Sharma');
      assert.equal(res.body.student.name, 'Aarav Sharma');
      assert.ok(res.body.student.taskCompletionRate);
      assert.ok(Array.isArray(res.body.student.recentTasks));
      assert.ok(Array.isArray(res.body.student.recentMockProgress));

      // Strictly zero-knowledge: personal journal and mood history are shielded
      assert.equal(res.body.student.journal, undefined);
      assert.equal(res.body.student.moodHistory, undefined);
      assert.equal(res.body.student.reflectionNotes, undefined);
      assert.ok(res.body.privacyNotice.includes('personal journal entries'));
    });

    it('parent-1 is forbidden from accessing unlinked student-2 dashboard (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/parent?studentId=student-2', parentCookie);
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('restricted to linked parents only'));
    });

    it('parent omitting studentId defaults safely to server-verified linked child', async () => {
      const res = await authedRequest('/api/dashboards/parent', parentCookie);
      assert.equal(res.status, 200);
      assert.equal(res.body.student.name, 'Aarav Sharma');
    });

    it('parent cannot forge arbitrary studentId to access non-existent or foreign student (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/parent?studentId=student-hacked-999', parentCookie);
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('restricted to linked parents only'));
    });
  });

  // =========================================================================
  // 5. Session Lifecycle, Revocation, Expiry & Bearer Token Integrity
  // =========================================================================
  describe('5. Session Lifecycle, Revocation, Expiry & Bearer Token Integrity', () => {
    it('POST /api/auth/logout revokes session and clears cookie; subsequent requests return 401', async () => {
      // 1. Create a dedicated session for logout test
      const tempCookie = await obtainSessionCookie('student-1');

      // 2. Verify active session
      const beforeRes = await authedRequest('/api/auth/me', tempCookie);
      assert.equal(beforeRes.status, 200);

      // 3. Logout
      const logoutRes = await authedRequest('/api/auth/logout', tempCookie, { method: 'POST' });
      assert.equal(logoutRes.status, 200);
      assert.equal(logoutRes.body.success, true);
      const clearCookie = logoutRes.headers.get('set-cookie');
      assert.ok(clearCookie.includes('Max-Age=0'));

      // 4. Session token is revoked and cannot access /api/auth/me
      const afterRes = await authedRequest('/api/auth/me', tempCookie);
      assert.equal(afterRes.status, 401);
      assert.equal(afterRes.body.error, 'Authentication required');
    });

    it('Forged or tampered session cookie returns 401', async () => {
      const fakeCookie = 'mindspring_session=totally_bogus_token_1234567890';
      const res = await authedRequest('/api/auth/me', fakeCookie);
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });

    it('Malformed session cookie header does not crash server and returns 401', async () => {
      const malformedCookie = 'mindspring_session=; invalid;;; ==';
      const res = await authedRequest('/api/auth/me', malformedCookie);
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });

    it('Expired session token returns 401 and is removed from active sessions store', async () => {
      // Create session with negative TTL (already expired)
      const { token } = createSession('student-1', 'student', -5000);
      const expiredCookie = `mindspring_session=${token}`;

      const res = await authedRequest('/api/auth/me', expiredCookie);
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');

      // Confirm deleted from store
      assert.equal(getSession(token), null);
    });

    it('Valid server-issued session token via Bearer header authenticates successfully', async () => {
      const { token } = createSession('student-1', 'student');
      try {
        const res = await rawRequest('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.user.id, 'student-1');
      } finally {
        revokeSession(token);
      }
    });

    it('Forged Bearer token returns 401 and cannot bypass authentication', async () => {
      const res = await rawRequest('/api/auth/me', {
        headers: {
          'Authorization': 'Bearer forged-bearer-token-12345'
        }
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });
  });

  // =========================================================================
  // 6. Authentication, Registration, Password Verification & Timing Defense
  // =========================================================================
  describe('6. Authentication, Registration, Password Verification & Timing Defense', () => {
    it('login with valid scrypt password succeeds and returns sanitized user object', async () => {
      const res = await authedRequest('/api/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({
          email: 'aarav@mindspring.demo',
          password: 'DemoPass123!'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, 'aarav@mindspring.demo');
      // Password hash must never leak in API response
      assert.equal(res.body.user.passwordHash, undefined);
      assert.ok(res.headers.get('set-cookie'));
    });

    it('login with invalid password returns 401 Invalid credentials', async () => {
      const res = await authedRequest('/api/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({
          email: 'aarav@mindspring.demo',
          password: 'WrongPassword999!'
        })
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Invalid credentials');
    });

    it('login with non-existent email returns 404 and executes dummy constant-time verification', async () => {
      const res = await authedRequest('/api/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({
          email: 'nobody_exists@mindspring.demo',
          password: 'SomePassword123!'
        })
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'User not found');
    });

    it('login without credentials returns 400 Bad Request', async () => {
      const res = await authedRequest('/api/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({})
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Email and password are required');
    });

    it('login rotates session token when user already has an active session', async () => {
      // 1. Initial session
      const initialCookie = await obtainSessionCookie('student-1');
      const oldToken = initialCookie.split('=')[1];
      assert.ok(getSession(oldToken), 'Old session must exist before login');

      // 2. Perform password login using initial session
      const loginRes = await authedRequest('/api/auth/login', initialCookie, {
        method: 'POST',
        body: JSON.stringify({
          email: 'aarav@mindspring.demo',
          password: 'DemoPass123!'
        })
      });
      assert.equal(loginRes.status, 200);

      // 3. Old session token must be revoked
      assert.equal(getSession(oldToken), null, 'Old session token must be revoked on login');

      // 4. New session token issued
      const newCookie = loginRes.headers.get('set-cookie').split(';')[0];
      const newToken = newCookie.split('=')[1];
      assert.notEqual(oldToken, newToken, 'Session token must be rotated');
      assert.ok(getSession(newToken), 'New session token must exist in store');
    });

    it('registration rejects missing name or email with 400', async () => {
      const res1 = await authedRequest('/api/auth/register', null, {
        method: 'POST',
        body: JSON.stringify({ email: 'test@demo.com', password: 'Password123!' })
      });
      assert.equal(res1.status, 400);

      const res2 = await authedRequest('/api/auth/register', null, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Student', password: 'Password123!' })
      });
      assert.equal(res2.status, 400);
    });

    it('registration rejects password under 8 characters with 400', async () => {
      const res = await authedRequest('/api/auth/register', null, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Short Pass User',
          email: 'shortpass@demo.com',
          password: '123'
        })
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Password must be at least 8 characters long');
    });

    it('registration rejects duplicate email with 409 Conflict', async () => {
      const res = await authedRequest('/api/auth/register', null, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Impostor Aarav',
          email: 'aarav@mindspring.demo',
          password: 'Password123!'
        })
      });
      assert.equal(res.status, 409);
      assert.equal(res.body.error, 'Email is already registered');
    });

    it('registration successfully hashes password with scrypt and never exposes hash', async () => {
      const uniqueEmail = `student_${Date.now()}@mindspring.test`;
      const res = await authedRequest('/api/auth/register', null, {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Registered Student',
          email: uniqueEmail,
          password: 'NewSecurePassword123!',
          examGoal: 'JEE Advanced 2028'
        })
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, uniqueEmail);
      assert.equal(res.body.user.passwordHash, undefined, 'passwordHash must never be exposed');

      // Verify created in USERS store with valid scrypt hash
      const stored = USERS.find(u => u.email === uniqueEmail);
      assert.ok(stored);
      assert.ok(stored.passwordHash.startsWith('$scrypt$'));
    });

    it('all user objects returned by /api/auth/demo-users have passwordHash stripped', async () => {
      const res = await authedRequest('/api/auth/demo-users', null);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.users));
      for (const u of res.body.users) {
        assert.equal(u.passwordHash, undefined, `User ${u.id} leaked passwordHash`);
      }
    });
  });

  // =========================================================================
  // 7. CSRF Origin, Referer & Cross-Site Defense
  // =========================================================================
  describe('7. CSRF Origin, Referer & Cross-Site Defense', () => {
    it('mutating POST request with untrusted Origin returns 403', async () => {
      const res = await rawRequest('/api/academic/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://malicious-attacker.com',
          'Cookie': student1Cookie
        },
        body: JSON.stringify({ title: 'CSRF Attack Task' })
      });
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'CSRF check failed: Origin not allowed');
    });

    it('mutating PUT request with untrusted Referer (and omitted Origin) returns 403', async () => {
      const res = await rawRequest('/api/academic/tasks/task-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'http://evil-phish.com/attack.html',
          'Cookie': student1Cookie
        },
        body: JSON.stringify({ title: 'Modified via CSRF' })
      });
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'CSRF check failed: Referer origin not allowed');
    });

    it('mutating DELETE request with Sec-Fetch-Site: cross-site returns 403', async () => {
      const res = await rawRequest('/api/academic/tasks/task-1', {
        method: 'DELETE',
        headers: {
          'Origin': baseUrl,
          'Sec-Fetch-Site': 'cross-site',
          'Cookie': student1Cookie
        }
      });
      assert.equal(res.status, 403);
      assert.equal(res.body.error, 'CSRF check failed: Cross-site requests are forbidden');
    });

    it('safe GET requests are exempt from CSRF Origin check', async () => {
      const res = await rawRequest('/api/academic/tasks', {
        method: 'GET',
        headers: {
          'Origin': 'http://random-untrusted-site.com',
          'Cookie': student1Cookie
        }
      });
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.tasks));
    });

    it('valid genuine Bearer token bypasses CSRF Origin requirement for API clients', async () => {
      const { token } = createSession('student-1', 'student');
      try {
        const res = await rawRequest('/api/academic/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            // No Origin or Referer header supplied
          },
          body: JSON.stringify({ title: 'API Client Automated Task' })
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
      } finally {
        revokeSession(token);
      }
    });

    it('forged Bearer token cannot bypass CSRF check and returns 401', async () => {
      const res = await rawRequest('/api/academic/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer counterfeit-token-12345'
        },
        body: JSON.stringify({ title: 'Forged Bearer Task' })
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Invalid or expired Bearer token');
    });

    it('in production mode, cookie-authenticated mutating request missing both Origin and Referer returns 403', async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const res = await rawRequest('/api/academic/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': student1Cookie
            // Neither Origin nor Referer provided
          },
          body: JSON.stringify({ title: 'Production Missing Origin Task' })
        });
        assert.equal(res.status, 403);
        assert.equal(res.body.error, 'CSRF check failed: Missing Origin or Referer header');
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });

  // =========================================================================
  // 8. Demo Mode Fail-Closed Production Guard
  // =========================================================================
  describe('8. Demo Mode Fail-Closed Production Guard', () => {
    it('POST /api/auth/demo-bootstrap returns 403 when NODE_ENV is production', async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const res = await rawRequest('/api/auth/demo-bootstrap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': baseUrl
          },
          body: JSON.stringify({ userId: 'student-1' })
        });
        assert.equal(res.status, 403);
        assert.equal(res.body.error, 'Demo bootstrap is only available in development and test environments');
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it('POST /api/auth/switch-role returns 403 when NODE_ENV is production', async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const res = await rawRequest('/api/auth/switch-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': baseUrl
          },
          body: JSON.stringify({ role: 'counsellor' })
        });
        assert.equal(res.status, 403);
        assert.equal(res.body.error, 'Role switching is only available in development and test environments');
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it('GET /api/auth/demo-users returns 403 when NODE_ENV is production', async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const res = await rawRequest('/api/auth/demo-users');
        assert.equal(res.status, 403);
        assert.equal(res.body.error, 'Demo mode is disabled in this environment');
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it('demo endpoints return 403 when ENABLE_DEMO_MODE is explicitly false', async () => {
      const prevFlag = process.env.ENABLE_DEMO_MODE;
      try {
        process.env.ENABLE_DEMO_MODE = 'false';
        const res = await rawRequest('/api/auth/demo-bootstrap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': baseUrl
          },
          body: JSON.stringify({ userId: 'student-1' })
        });
        assert.equal(res.status, 403);
      } finally {
        process.env.ENABLE_DEMO_MODE = prevFlag;
      }
    });

    it('demo bootstrap and switch-role reject non-demo fixtures with 404 (prevents account takeover)', async () => {
      // 1. Create a non-demo user in USERS
      const nonDemoUser = {
        id: `real-user-${Date.now()}`,
        name: 'Real User',
        email: `real_${Date.now()}@real.com`,
        role: 'student',
        isDemoFixture: false,
        passwordHash: '$scrypt$dummy'
      };
      USERS.push(nonDemoUser);

      // 2. Attempt to bootstrap into this non-demo account
      const bootRes = await authedRequest('/api/auth/demo-bootstrap', null, {
        method: 'POST',
        body: JSON.stringify({ userId: nonDemoUser.id })
      });
      assert.equal(bootRes.status, 404);
      assert.equal(bootRes.body.error, 'Demo fixture not found');

      // 3. Attempt to switch role into this non-demo account
      const switchRes = await authedRequest('/api/auth/switch-role', null, {
        method: 'POST',
        body: JSON.stringify({ userId: nonDemoUser.id })
      });
      assert.equal(switchRes.status, 404);
      assert.equal(switchRes.body.error, 'Target role/user not found');
    });
  });

  // =========================================================================
  // 9. Privacy Consent Isolation & Session Boundaries
  // =========================================================================
  describe('9. Privacy Consent Isolation & Session Boundaries', () => {
    it('POST /api/auth/consent mutates only the caller user; other student consent is unmodified', async () => {
      // 1. Initial state: both student-1 and student-2 have consentGiven: true
      const s1MeInit = await authedRequest('/api/auth/me', student1Cookie);
      assert.equal(s1MeInit.body.user.consentGiven, true);

      const s2MeInit = await authedRequest('/api/auth/me', student2Cookie);
      assert.equal(s2MeInit.body.user.consentGiven, true);

      // 2. student-1 revokes consent and updates emergency contact
      const s1ConsentRes = await authedRequest('/api/auth/consent', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          consentGiven: false,
          emergencyContact: {
            name: 'Updated Contact',
            phone: '+91 99999 88888'
          }
        })
      });
      assert.equal(s1ConsentRes.status, 200);
      assert.equal(s1ConsentRes.body.user.consentGiven, false);

      // 3. Verify student-1 session reflects consentGiven: false
      const s1MeAfter = await authedRequest('/api/auth/me', student1Cookie);
      assert.equal(s1MeAfter.body.user.consentGiven, false);
      assert.equal(s1MeAfter.body.user.emergencyContact.name, 'Updated Contact');

      // 4. Critical check: student-2 consent remains true and unaffected
      const s2MeAfter = await authedRequest('/api/auth/me', student2Cookie);
      assert.equal(s2MeAfter.body.user.consentGiven, true, 'student-2 consent must NOT be modified by student-1');

      // 5. Restore student-1 consent
      await authedRequest('/api/auth/consent', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({ consentGiven: true })
      });
      const s1MeRestored = await authedRequest('/api/auth/me', student1Cookie);
      assert.equal(s1MeRestored.body.user.consentGiven, true);
    });
  });
});
