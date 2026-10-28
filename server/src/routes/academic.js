import express from 'express';
import { requireRole } from '../middleware/auth.js';
import {
  TODO_TASKS,
  MOCK_TESTS,
  MISTAKE_NOTEBOOK,
  BACKLOG_ITEMS,
  REVISION_SCHEDULE
} from '../db/store.js';

const router = express.Router();

// Enforce student role on all academic routes
router.use(requireRole('student'));

/**
 * Validates requested studentId against authenticated identity
 * Returns 403 on mismatch; defaults to authenticated req.user.id
 */
function getValidatedStudentKey(req, res) {
  const actingId = req.user.id;
  const requestedId = req.query.studentId || req.body?.studentId;

  if (requestedId && requestedId !== actingId) {
    res.status(403).json({ error: "Forbidden: Access to another student's academic data is prohibited" });
    return null;
  }
  return actingId;
}

// To-Do Planner: Tasks Endpoints
router.get('/tasks', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const tasks = TODO_TASKS[key] || [];
  
  const { date, month } = req.query;
  let filtered = [...tasks];
  if (date) {
    filtered = filtered.filter(t => t.date === date);
  } else if (month) {
    // month formatted as 'YYYY-MM'
    filtered = filtered.filter(t => t.date.startsWith(month));
  }
  
  res.json({ tasks: filtered });
});

router.post('/tasks', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { title, description, date, startTime, priority, category, reminderMinutesBefore } = req.body || {};
  if (!TODO_TASKS[key]) TODO_TASKS[key] = [];

  const newTask = {
    id: `task-${Date.now()}`,
    studentId: key,
    title: title || 'Untitled Task',
    description: description || '',
    date: date || new Date().toISOString().split('T')[0],
    startTime: startTime || '10:00',
    priority: priority || 'medium',
    category: category || 'Study',
    reminderMinutesBefore: reminderMinutesBefore !== undefined ? Number(reminderMinutesBefore) : 10,
    completed: false,
    createdAt: new Date().toISOString(),
    notified: false
  };

  TODO_TASKS[key].unshift(newTask);
  res.json({ success: true, task: newTask });
});

router.put('/tasks/:id', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { id } = req.params;
  const tasks = TODO_TASKS[key] || [];
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex !== -1) {
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...req.body,
      id, // preserve ID
      studentId: key // preserve authenticated ownership
    };
    return res.json({ success: true, task: tasks[taskIndex] });
  }

  res.status(404).json({ error: 'Task not found' });
});

router.delete('/tasks/:id', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { id } = req.params;
  const tasks = TODO_TASKS[key];
  if (tasks) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      tasks.splice(taskIndex, 1);
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: 'Task not found' });
});

router.post('/tasks/toggle', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { taskId } = req.body || {};
  const tasks = TODO_TASKS[key] || [];
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    return res.json({ success: true, task });
  }
  res.status(404).json({ error: 'Task not found' });
});

router.post('/tasks/:id/reschedule', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { id } = req.params;
  const { date } = req.body || {};
  const tasks = TODO_TASKS[key] || [];
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.date = date;
    task.notified = false; // reset notification for rescheduled date
    return res.json({ success: true, task });
  }
  res.status(404).json({ error: 'Task not found' });
});

// Mock Tests
router.get('/mock-tests', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const tests = MOCK_TESTS[key] || [];
  res.json({ tests });
});

router.post('/mock-tests', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { title, score, totalMarks, percentile, rank, physics, chemistry, maths, notes } = req.body || {};
  if (!MOCK_TESTS[key]) MOCK_TESTS[key] = [];

  const newTest = {
    id: `mt-${Date.now()}`,
    title: title || 'Full Mock Test',
    date: new Date().toISOString().split('T')[0],
    score: Number(score) || 0,
    totalMarks: Number(totalMarks) || 300,
    percentile: Number(percentile) || 95,
    rank: Number(rank) || 250,
    physics: Number(physics) || 0,
    chemistry: Number(chemistry) || 0,
    maths: Number(maths) || 0,
    notes: notes || ''
  };
  MOCK_TESTS[key].unshift(newTest);
  res.json({ success: true, test: newTest });
});

// Mistake Notebook
router.get('/mistakes', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const mistakes = MISTAKE_NOTEBOOK[key] || [];
  res.json({ mistakes });
});

router.post('/mistakes', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { subject, topic, errorType, description, solutionKey } = req.body || {};
  if (!MISTAKE_NOTEBOOK[key]) MISTAKE_NOTEBOOK[key] = [];

  const newMistake = {
    id: `err-${Date.now()}`,
    subject: subject || 'Physics',
    topic: topic || 'General Concept',
    errorType: errorType || 'Conceptual Error',
    description: description || '',
    solutionKey: solutionKey || '',
    date: new Date().toISOString().split('T')[0],
    reviewed: false
  };
  MISTAKE_NOTEBOOK[key].unshift(newMistake);
  res.json({ success: true, mistake: newMistake });
});

router.post('/mistakes/toggle', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { mistakeId } = req.body || {};
  const list = MISTAKE_NOTEBOOK[key] || [];
  const item = list.find(m => m.id === mistakeId);
  if (item) {
    item.reviewed = !item.reviewed;
    return res.json({ success: true, item });
  }
  res.status(404).json({ error: 'Mistake item not found' });
});

// Backlogs
router.get('/backlogs', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const backlogs = BACKLOG_ITEMS[key] || [];
  res.json({ backlogs });
});

router.post('/backlogs', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { subject, chapter, urgency, estimatedHours, notes } = req.body || {};
  if (!BACKLOG_ITEMS[key]) BACKLOG_ITEMS[key] = [];

  const newBacklog = {
    id: `bg-${Date.now()}`,
    subject: subject || 'Physics',
    chapter: chapter || 'Untitled Chapter',
    urgency: urgency || 'Medium',
    estimatedHours: Number(estimatedHours) || 2,
    notes: notes || '',
    completed: false
  };
  BACKLOG_ITEMS[key].push(newBacklog);
  res.json({ success: true, backlog: newBacklog });
});

router.post('/backlogs/toggle', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const { backlogId } = req.body || {};
  const list = BACKLOG_ITEMS[key] || [];
  const item = list.find(b => b.id === backlogId);
  if (item) {
    item.completed = !item.completed;
    return res.json({ success: true, item });
  }
  res.status(404).json({ error: 'Backlog item not found' });
});

// Revision Schedule
router.get('/revision', (req, res) => {
  const key = getValidatedStudentKey(req, res);
  if (!key) return;

  const schedule = REVISION_SCHEDULE[key] || [];
  res.json({ revisionSchedule: schedule });
});

export default router;
