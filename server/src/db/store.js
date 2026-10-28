// Centralized in-memory store pre-populated with realistic demo data
import { generateSessionToken, hashPassword } from '../middleware/security.js';

const DEMO_PASSWORD_HASH = hashPassword('DemoPass123!');

export const USERS = [
  {
    id: 'student-1',
    name: 'Aarav Sharma',
    email: 'aarav@mindspring.demo',
    role: 'student',
    isDemoFixture: true,
    passwordHash: DEMO_PASSWORD_HASH,
    ageGroup: '16-18',
    examGoal: 'JEE Main & Advanced 2027',
    targetScore: 'Rank < 1500 / 99.5 %ile',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    dailyTargetHours: 6.5,
    consentGiven: true,
    emergencyContact: {
      name: 'Sunita Sharma',
      relation: 'Mother',
      phone: '+91 98765 43210',
      email: 'sunita.sharma@demo.com',
      notifyOnCrisis: true
    }
  },
  {
    id: 'student-2',
    name: 'Priya Patel',
    email: 'priya@mindspring.demo',
    role: 'student',
    isDemoFixture: true,
    passwordHash: DEMO_PASSWORD_HASH,
    ageGroup: '16-18',
    examGoal: 'NEET-UG 2027',
    targetScore: '680 / 720',
    subjects: ['Biology', 'Physics', 'Chemistry'],
    dailyTargetHours: 7,
    consentGiven: true,
    emergencyContact: {
      name: 'Rajesh Patel',
      relation: 'Father',
      phone: '+91 98111 22334',
      email: 'rajesh.patel@demo.com',
      notifyOnCrisis: true
    }
  },
  {
    id: 'parent-1',
    name: 'Sunita Sharma',
    email: 'sunita@mindspring.demo',
    role: 'parent',
    isDemoFixture: true,
    passwordHash: DEMO_PASSWORD_HASH,
    studentIds: ['student-1'],
    studentName: 'Aarav Sharma'
  },
  {
    id: 'counsellor-1',
    name: 'Dr. Ananya Roy, M.Phil',
    email: 'ananya@mindspring.demo',
    role: 'counsellor',
    isDemoFixture: true,
    passwordHash: DEMO_PASSWORD_HASH,
    specialization: 'Adolescent Psychology & Exam Performance Anxiety',
    licenseNumber: 'RCI-CLIN-2021-9844'
  },
  {
    id: 'admin-1',
    name: 'Admin Safeguarding Desk',
    email: 'admin@mindspring.demo',
    role: 'admin',
    isDemoFixture: true,
    passwordHash: DEMO_PASSWORD_HASH
  }
];

const nowIso = new Date().toISOString();
const todayDate = nowIso.split('T')[0];
const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const TODO_TASKS = {
  'student-1': [
    {
      id: 'task-1',
      studentId: 'student-1',
      title: 'Morning Mindful Breathing & Hydration',
      description: 'Start the day gently with 5 minutes of calming box breathing and a glass of water.',
      date: todayDate,
      startTime: '07:30',
      priority: 'low',
      category: 'Personal',
      reminderMinutesBefore: 5,
      completed: true,
      createdAt: nowIso
    },
    {
      id: 'task-2',
      studentId: 'student-1',
      title: 'Practice 15 Calculus PYQs without time panic',
      description: 'Focus on understanding step logic rather than rushing the stopwatch.',
      date: todayDate,
      startTime: '09:30',
      priority: 'high',
      category: 'Practice',
      reminderMinutesBefore: 10,
      completed: false,
      createdAt: nowIso
    },
    {
      id: 'task-3',
      studentId: 'student-1',
      title: 'Review Electrochemistry Short Notes',
      description: 'Review galvanic cell conventions and Nernst equation applications.',
      date: todayDate,
      startTime: '14:00',
      priority: 'medium',
      category: 'Revision',
      reminderMinutesBefore: 15,
      completed: false,
      createdAt: nowIso
    },
    {
      id: 'task-4',
      studentId: 'student-1',
      title: 'Evening Outdoor Walk (No Study Talk)',
      description: 'Disconnect from screens, breathe fresh air, and let the mind reset.',
      date: todayDate,
      startTime: '17:30',
      priority: 'low',
      category: 'Personal',
      reminderMinutesBefore: 0,
      completed: false,
      createdAt: nowIso
    },
    {
      id: 'task-5',
      studentId: 'student-1',
      title: 'Solve Ray Optics Convex Lens Diagrams',
      description: 'Work through 5 ray tracing problems with clean pencil diagrams.',
      date: todayDate,
      startTime: '19:30',
      priority: 'medium',
      category: 'Study',
      reminderMinutesBefore: 15,
      completed: false,
      createdAt: nowIso
    },
    {
      id: 'task-6',
      studentId: 'student-1',
      title: 'Organic Chemistry Functional Groups Recap',
      description: 'Review aldehyde and ketone distinction tests.',
      date: tomorrowDate,
      startTime: '10:00',
      priority: 'high',
      category: 'Revision',
      reminderMinutesBefore: 15,
      completed: false,
      createdAt: nowIso
    },
    {
      id: 'task-7',
      studentId: 'student-1',
      title: 'Organize Desk & 7-Hour Sleep Wind Down',
      description: 'Tidy up notes and prepare for restful, restorative sleep before 11 PM.',
      date: tomorrowDate,
      startTime: '21:30',
      priority: 'low',
      category: 'Personal',
      reminderMinutesBefore: 30,
      completed: false,
      createdAt: nowIso
    },
    {
      id: 'task-8',
      studentId: 'student-1',
      title: 'Physics Mechanics Formula Flashcards',
      description: 'Quick active recall session for rotational inertia formulas.',
      date: yesterdayDate,
      startTime: '16:00',
      priority: 'medium',
      category: 'Revision',
      reminderMinutesBefore: 10,
      completed: true,
      createdAt: nowIso
    }
  ]
};

export const STUDY_PLAN = {
  'student-1': [
    { id: 'plan-1', subject: 'Physics', task: 'Solve 25 PYQs on Rotational Dynamics (Angular Momentum conservation)', durationMin: 75, completed: true, scheduledTime: '08:00 AM' },
    { id: 'plan-2', subject: 'Mathematics', task: 'Definite Integrals: Properties 4 & 5 problem sets', durationMin: 90, completed: true, scheduledTime: '10:30 AM' },
    { id: 'plan-3', subject: 'Chemistry', task: 'Coordination Compounds: Crystal Field Splitting Theory notes review', durationMin: 60, completed: false, scheduledTime: '02:30 PM' },
    { id: 'plan-4', subject: 'Self-Care', task: 'Mindful 20-min evening walk or stretching break (No screens!)', durationMin: 20, completed: false, scheduledTime: '05:30 PM' },
    { id: 'plan-5', subject: 'Physics', task: 'Formula sheet flashcards review before winding down', durationMin: 30, completed: false, scheduledTime: '08:00 PM' }
  ]
};

export const MOCK_TESTS = {
  'student-1': [
    { id: 'mt-1', title: 'JEE Main Full Test #4 (Allen/Resonance Series)', date: '2026-10-22', score: 218, totalMarks: 300, percentile: 98.4, rank: 142, physics: 78, chemistry: 82, maths: 58, notes: 'Maths integration was time-consuming. Need better pacing.' },
    { id: 'mt-2', title: 'JEE Main Full Test #3', date: '2026-10-15', score: 204, totalMarks: 300, percentile: 97.2, rank: 210, physics: 72, chemistry: 76, maths: 56, notes: 'Coordination compounds formula slip.' },
    { id: 'mt-3', title: 'Part Syllabus Test (Mechanics & Organic)', date: '2026-10-08', score: 232, totalMarks: 300, percentile: 99.1, rank: 85, physics: 84, chemistry: 86, maths: 62, notes: 'Strong grasp in mechanics.' }
  ]
};

export const MISTAKE_NOTEBOOK = {
  'student-1': [
    { id: 'err-1', subject: 'Mathematics', topic: 'Definite Integrals', errorType: 'Calculation Mistake', description: 'Substituted upper limit incorrectly in step 4 with negative sign omitted.', solutionKey: 'Always double bracket negative boundaries.', date: '2026-10-22', reviewed: false },
    { id: 'err-2', subject: 'Physics', topic: 'Rotational Motion', errorType: 'Conceptual Error', description: 'Confused torque about center of mass vs instantaneous center of zero velocity.', solutionKey: 'First write the axis of reference explicitly before writing tau = I * alpha.', date: '2026-10-22', reviewed: true },
    { id: 'err-3', subject: 'Chemistry', topic: 'Electrochemical Series', errorType: 'Silly Error', description: 'Mixed up anode reduction potential vs oxidation potential polarity.', solutionKey: 'Standard convention always uses reduction potentials: E_cell = E_cathode - E_anode.', date: '2026-10-15', reviewed: true }
  ]
};

export const BACKLOG_ITEMS = {
  'student-1': [
    { id: 'bg-1', subject: 'Mathematics', chapter: 'Probability & Bayes Theorem', urgency: 'High', estimatedHours: 4.5, notes: 'Missed class due to seasonal flu.', completed: false },
    { id: 'bg-2', subject: 'Chemistry', chapter: 'Surface Chemistry & Colloids', urgency: 'Medium', estimatedHours: 2.5, notes: 'NCERT line-by-line reading remaining.', completed: false },
    { id: 'bg-3', subject: 'Physics', chapter: 'Wave Optics (Polarization & Resolving Power)', urgency: 'Low', estimatedHours: 2, notes: 'Quick formula revision needed.', completed: true }
  ]
};

export const REVISION_SCHEDULE = {
  'student-1': [
    { id: 'rev-1', subject: 'Physics', topic: 'Electrostatics & Gauss Law', interval: 'Day 21 Review', dueDate: 'Tomorrow', status: 'Due Soon' },
    { id: 'rev-2', subject: 'Chemistry', topic: 'Aldehydes & Ketones Reaction Mechanisms', interval: 'Day 7 Review', dueDate: 'Today', status: 'Due Today' },
    { id: 'rev-3', subject: 'Mathematics', topic: 'Conic Sections: Parabola properties', interval: 'Day 3 Review', dueDate: 'In 3 days', status: 'Upcoming' }
  ]
};

export const MOOD_LOGS = {
  'student-1': [
    { date: '2026-10-27', mood: 'Stressed', level: 3, energy: 3, note: 'Mock test coming up this weekend. Nervous about math pace.', tags: ['Mock Anxiety', 'Need Sleep'] },
    { date: '2026-10-26', mood: 'Good', level: 4, energy: 4, note: 'Completed physics PYQs on time. Felt accomplished!', tags: ['Productive', 'Calm'] },
    { date: '2026-10-25', mood: 'Okay', level: 3, energy: 3, note: 'Average day. Took a 15 min walk after dinner.', tags: ['Balanced'] },
    { date: '2026-10-24', mood: 'Exhausted', level: 2, energy: 2, note: 'Late night study drained me. Need to prioritize 7 hours sleep.', tags: ['Tired', 'Burnout warning'] },
    { date: '2026-10-23', mood: 'Great', level: 5, energy: 4, note: 'Good group study session with Rohit. Cleared doubts.', tags: ['Supported', 'Confident'] },
    { date: '2026-10-22', mood: 'Stressed', level: 2, energy: 3, note: 'Mock #4 math score was below target.', tags: ['Score Disappointment'] },
    { date: '2026-10-21', mood: 'Good', level: 4, energy: 4, note: 'Solid organic chemistry revision.', tags: ['Flow state'] }
  ]
};

export const WELLBEING_ASSESSMENTS = {
  'student-1': [
    {
      id: 'wb-1',
      date: '2026-10-25',
      scores: {
        mood: 3, // 1-5
        stress: 4, // 1-5 (5 is high stress)
        sleep: 3, // 1-5
        energy: 3,
        socialConnection: 3,
        academicPressure: 4,
        supportAccess: 4
      },
      overallIndex: 64, // out of 100 wellbeing indicator
      summaryFeedback: 'You are managing a heavy academic workload with commendable dedication, but elevated stress and slight sleep deficit are noticeable. Pacing yourself and honoring 7-hour sleep will actually enhance memory consolidation.',
      recommendation: 'Consider scheduling a relaxing 20-minute wind-down routine before sleep and talking to a mentor if math pacing continues to trigger anxiety.',
      consultationSuggested: false
    },
    {
      id: 'wb-2',
      date: '2026-10-18',
      scores: {
        mood: 4,
        stress: 3,
        sleep: 4,
        energy: 4,
        socialConnection: 4,
        academicPressure: 3,
        supportAccess: 4
      },
      overallIndex: 78,
      summaryFeedback: 'Great balance of study and rest this week. Your energy and emotional reserves were in a healthy zone.',
      recommendation: 'Maintain your current hydration and break rhythms.',
      consultationSuggested: false
    }
  ]
};

export const PRIVATE_JOURNAL = {
  'student-1': [
    {
      id: 'jr-1',
      date: '2026-10-26T21:45:00Z',
      title: 'Letting go of comparison today',
      content: 'In coaching class, sir praised two students who finished the test in 2 hours. For 10 minutes I felt a knot in my stomach. But then I reminded myself: their path is theirs, mine is mine. I improved my mechanics accuracy by 15% this month. That is real progress.',
      tags: ['Growth Mindset', 'Self-Compassion'],
      mood: 'Calm'
    },
    {
      id: 'jr-2',
      date: '2026-10-23T22:15:00Z',
      title: 'Things I am grateful for',
      content: '1. Mom making hot turmeric milk when I had a headache.\n2. Understanding the derivation of Bernoulli principle on my own.\n3. Listening to the rain during my evening tea break.',
      tags: ['Gratitude'],
      mood: 'Peaceful'
    }
  ]
};

export const COUNSELLORS = [
  {
    id: 'coun-1',
    name: 'Dr. Ananya Roy',
    title: 'Senior Adolescent Psychologist, M.Phil (NIMHANS)',
    experience: '12+ years experience in student stress and academic performance anxiety',
    avatar: '👩‍⚕️',
    languages: ['English', 'Hindi', 'Bengali'],
    availability: 'Mon - Fri, 4:00 PM - 8:00 PM',
    rating: 4.9,
    reviewsCount: 148,
    badges: ['Certified Clinical Psychologist', 'Youth Mental Health Specialist']
  },
  {
    id: 'coun-2',
    name: 'Mr. Arvind Swaminathan',
    title: 'Educational Counsellor & Career Resilience Mentor',
    experience: '10+ years helping JEE/NEET aspirants conquer test phobia and burnout',
    avatar: '👨‍🏫',
    languages: ['English', 'Tamil', 'Hindi'],
    availability: 'Tue - Sat, 5:00 PM - 9:00 PM',
    rating: 4.8,
    reviewsCount: 112,
    badges: ['Cognitive Reframing Coach', 'Former IIT Madras Alum']
  },
  {
    id: 'coun-3',
    name: 'Dr. Meera Nambiar',
    title: 'Child & Adolescent Psychiatrist (MD)',
    experience: '15+ years clinical practice, specialized in student sleep hygiene & attention',
    avatar: '👩‍⚕️',
    languages: ['English', 'Hindi', 'Malayalam'],
    availability: 'Wed, Fri, Sun, 10:00 AM - 2:00 PM',
    rating: 4.95,
    reviewsCount: 195,
    badges: ['Medical Specialist', 'Stress Management Expert']
  }
];

export const CONSULTATION_REQUESTS = [
  {
    id: 'req-1',
    studentId: 'student-1',
    studentName: 'Aarav Sharma',
    counsellorId: 'coun-1',
    counsellorName: 'Dr. Ananya Roy',
    reason: 'Exam pacing anxiety and difficulty falling asleep before mock tests.',
    preferredSlot: 'Wednesday 5:00 PM',
    status: 'Confirmed',
    createdAt: '2026-10-26T14:30:00Z',
    confidentialNotes: 'Student initiated request. Explicit consent given for 1-on-1 virtual audio/video session.'
  }
];

export const AUDIT_LOGS = [
  {
    id: 'log-1',
    timestamp: '2026-10-27T10:15:20Z',
    actorRole: 'student',
    actorName: 'Aarav Sharma',
    action: 'JOURNAL_SAVED_LOCAL',
    details: 'User saved private reflection. Reassured zero-knowledge client protection.'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-26T14:30:00Z',
    actorRole: 'student',
    actorName: 'Aarav Sharma',
    action: 'COUNSELLOR_REQUEST_FILED',
    details: 'Confidential appointment requested with Dr. Ananya Roy.'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-25T19:00:00Z',
    actorRole: 'parent',
    actorName: 'Sunita Sharma',
    action: 'VIEWED_ACADEMIC_PROGRESS',
    details: 'Viewed authorized syllabus completion and mock test trends. Sensitive wellbeing reflections remained shielded.'
  }
];


export const TEACHERS = {
  'student-1': [
    {
      id: 'tch-1',
      name: 'Prof. Vikram Sen',
      subject: 'Physics & Mechanics',
      schoolOrCoaching: 'Apex Institute / Super-30 Cohort',
      phone: '+91 98234 56789',
      email: 'vikram.sen@faculty.demo',
      availableHours: 'Mon-Fri 4:30 PM - 6:00 PM',
      notes: 'Approachable for pacing fears and conceptual doubt clearing. Always reminds students to sleep 7 hours.',
      isTrustedMentor: true
    },
    {
      id: 'tch-2',
      name: 'Mrs. Geeta Krishnan',
      subject: 'Mathematics & Calculus',
      schoolOrCoaching: 'Delhi Public School / Advanced Batch',
      phone: '+91 98345 67890',
      email: 'geeta.krishnan@faculty.demo',
      availableHours: 'Tue & Thu 5:00 PM - 7:00 PM',
      notes: 'Patient mentor who helps untangle test panic and formula slips without criticism.',
      isTrustedMentor: true
    }
  ]
};


// ==========================================
// In-Memory Active Sessions Store
// ==========================================
export const SESSIONS = new Map();

export function createSession(userId, role, ttlMs = 24 * 60 * 60 * 1000) {
  const token = generateSessionToken();
  const session = {
    id: token,
    userId,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs
  };
  SESSIONS.set(token, session);
  return { token, session };
}

export function getSession(token) {
  if (!token || typeof token !== 'string') return null;
  const session = SESSIONS.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    SESSIONS.delete(token);
    return null;
  }
  return session;
}

export function revokeSession(token) {
  if (!token) return false;
  return SESSIONS.delete(token);
}

export function revokeAllUserSessions(userId) {
  for (const [token, session] of SESSIONS.entries()) {
    if (session.userId === userId) {
      SESSIONS.delete(token);
    }
  }
}
