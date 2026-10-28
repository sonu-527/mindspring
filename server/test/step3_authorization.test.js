import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/index.js');
const { USERS } = await import('../src/db/store.js');

describe('Phase 3 Step 3: Authorization, Resource Ownership & Parent-Child Access Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // Helper to obtain a session cookie for any demo user
  async function getSessionCookieFor(userId) {
    const res = await fetch(`${baseUrl}/api/auth/demo-bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': baseUrl
      },
      body: JSON.stringify({ userId })
    });
    assert.equal(res.status, 200, `Failed to bootstrap session for ${userId}`);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Expected Set-Cookie header');
    return setCookie.split(';')[0];
  }

  async function authedRequest(endpoint, cookie, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      ...(cookie ? { 'Cookie': cookie } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(url, {
      ...options,
      headers
    });
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
  // 1. Unauthenticated Access Denial (401)
  // ==========================================
  describe('Unauthenticated Access Enforcement', () => {
    it('GET /api/academic/tasks without session cookie returns 401', async () => {
      const res = await authedRequest('/api/academic/tasks', null);
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });

    it('POST /api/academic/tasks without session cookie returns 401', async () => {
      const res = await authedRequest('/api/academic/tasks', null, {
        method: 'POST',
        body: JSON.stringify({ title: 'Unauthenticated Task' })
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });

    it('GET /api/wellbeing/journal without session cookie returns 401', async () => {
      const res = await authedRequest('/api/wellbeing/journal', null);
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });

    it('GET /api/dashboards/parent without session cookie returns 401', async () => {
      const res = await authedRequest('/api/dashboards/parent', null);
      assert.equal(res.status, 401);
      assert.equal(res.body.error, 'Authentication required');
    });
  });

  // ==========================================
  // 2. Cross-Student Tenant Isolation (403)
  // ==========================================
  describe('Cross-Student Tenant Isolation', () => {
    let student1Cookie;
    let student2Cookie;

    before(async () => {
      student1Cookie = await getSessionCookieFor('student-1');
      student2Cookie = await getSessionCookieFor('student-2');
    });

    it('student-1 cannot read student-2 academic tasks (returns 403)', async () => {
      const res = await authedRequest('/api/academic/tasks?studentId=student-2', student1Cookie);
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('prohibited') || res.body.error.includes('Forbidden'));
    });

    it('student-1 cannot create a task assigned to student-2 (returns 403)', async () => {
      const res = await authedRequest('/api/academic/tasks', student1Cookie, {
        method: 'POST',
        body: JSON.stringify({
          studentId: 'student-2',
          title: 'Cross-Tenant Injection Task'
        })
      });
      assert.equal(res.status, 403);
    });

    it('student-1 cannot read student-2 private journal entries (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/journal?studentId=student-2', student1Cookie);
      assert.equal(res.status, 403);
    });

    it('student-1 cannot read student-2 daily mood logs (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/mood?studentId=student-2', student1Cookie);
      assert.equal(res.status, 403);
    });

    it('student-1 cannot read or modify student-2 teacher contacts (returns 403)', async () => {
      const res = await authedRequest('/api/support/teachers?studentId=student-2', student1Cookie);
      assert.equal(res.status, 403);
    });

    it('student reads own resources using authenticated identity without studentId parameter', async () => {
      const taskRes = await authedRequest('/api/academic/tasks', student1Cookie);
      assert.equal(taskRes.status, 200);
      assert.ok(Array.isArray(taskRes.body.tasks));

      const journalRes = await authedRequest('/api/wellbeing/journal', student1Cookie);
      assert.equal(journalRes.status, 200);
      assert.ok(Array.isArray(journalRes.body.entries));

      const teacherRes = await authedRequest('/api/support/teachers', student1Cookie);
      assert.equal(teacherRes.status, 200);
      assert.ok(Array.isArray(teacherRes.body.teachers));
    });
  });

  // ==========================================
  // 3. Role-Based Access Control Violations (403)
  // ==========================================
  describe('Role-Based Access Control Violations', () => {
    let studentCookie;
    let parentCookie;
    let counsellorCookie;

    before(async () => {
      studentCookie = await getSessionCookieFor('student-1');
      parentCookie = await getSessionCookieFor('parent-1');
      counsellorCookie = await getSessionCookieFor('counsellor-1');
    });

    it('student cannot access parent dashboard (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/parent', studentCookie);
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('Forbidden'));
    });

    it('student cannot access counsellor dashboard (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/counsellor', studentCookie);
      assert.equal(res.status, 403);
    });

    it('student cannot access admin dashboard (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/admin', studentCookie);
      assert.equal(res.status, 403);
    });

    it('parent cannot access private student journal entries (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/journal', parentCookie);
      assert.equal(res.status, 403);
    });

    it('parent cannot access raw student mood logs (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/mood', parentCookie);
      assert.equal(res.status, 403);
    });

    it('counsellor cannot access private student journal entries (returns 403)', async () => {
      const res = await authedRequest('/api/wellbeing/journal', counsellorCookie);
      assert.equal(res.status, 403);
    });
  });

  // ==========================================
  // 4. Parent-Child Linkage & Aggregate Access Control
  // ==========================================
  describe('Parent-Child Relationship Verification', () => {
    let parent1Cookie;

    before(async () => {
      parent1Cookie = await getSessionCookieFor('parent-1');
    });

    it('authorized linked parent (parent-1) can access linked child (student-1) aggregate metrics', async () => {
      const res = await authedRequest('/api/dashboards/parent?studentId=student-1', parent1Cookie);
      assert.equal(res.status, 200);
      assert.equal(res.body.parentName, 'Sunita Sharma');
      assert.equal(res.body.student.name, 'Aarav Sharma');
      assert.ok(res.body.student.taskCompletionRate);
      assert.ok(Array.isArray(res.body.student.recentTasks));
      assert.ok(Array.isArray(res.body.student.recentMockProgress));

      // Reassure zero-knowledge: private journals are NOT present
      assert.equal(res.body.student.journal, undefined);
      assert.equal(res.body.student.moodHistory, undefined);
    });

    it('parent-1 is forbidden from accessing unlinked student-2 dashboard (returns 403)', async () => {
      const res = await authedRequest('/api/dashboards/parent?studentId=student-2', parent1Cookie);
      assert.equal(res.status, 403);
      assert.ok(res.body.error.includes('restricted to linked parents only'));
    });
  });
});
