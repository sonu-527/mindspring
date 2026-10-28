import { 
  User, 
  TodoTask,
  StudyTask, 
  MockTest, 
  MistakeEntry, 
  BacklogItem, 
  RevisionItem, 
  MoodLog, 
  WellbeingAssessment, 
  JournalEntry, 
  CompanionCharacter, 
  ConversationGoal, 
  Counsellor, 
  ConsultationRequest,
  TeacherContact 
} from '../types';

const API_BASE = '/api';

// ================= LOCAL FALLBACK STORE (FOR GITHUB PAGES STATIC HOSTING) =================
const LOCAL_USERS: User[] = [
  {
    id: 'student-1',
    name: 'Aarav Sharma',
    email: 'aarav@mindspring.demo',
    role: 'student',
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
    name: 'Mrs. Sunita Sharma',
    email: 'sunita@mindspring.demo',
    role: 'parent',
    studentName: 'Aarav Sharma'
  },
  {
    id: 'counsellor-1',
    name: 'Dr. Ananya Roy, M.Phil',
    email: 'ananya@mindspring.demo',
    role: 'counsellor',
    specialization: 'Adolescent Psychology & Exam Performance Anxiety'
  },
  {
    id: 'admin-1',
    name: 'Safeguarding Desk (Admin)',
    email: 'admin@mindspring.demo',
    role: 'admin'
  }
];

let currentUser: User = LOCAL_USERS[0];

const getInitialTodoTasks = (): Record<string, TodoTask[]> => {
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  try {
    const saved = localStorage.getItem('mindspring_todo_tasks');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}

  return {
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
};

const LOCAL_TODO_TASKS: Record<string, TodoTask[]> = getInitialTodoTasks();

const persistLocalTodoTasks = () => {
  try {
    localStorage.setItem('mindspring_todo_tasks', JSON.stringify(LOCAL_TODO_TASKS));
  } catch (e) {}
};

const LOCAL_TASKS: Record<string, StudyTask[]> = {
  'student-1': [
    { id: 'plan-1', subject: 'Physics', task: 'Solve 25 PYQs on Rotational Dynamics (Angular Momentum)', durationMin: 75, completed: true, scheduledTime: '08:00 AM' },
    { id: 'plan-2', subject: 'Mathematics', task: 'Definite Integrals: Properties 4 & 5 problem sets', durationMin: 90, completed: true, scheduledTime: '10:30 AM' },
    { id: 'plan-3', subject: 'Chemistry', task: 'Coordination Compounds: Crystal Field Splitting Theory notes review', durationMin: 60, completed: false, scheduledTime: '02:30 PM' },
    { id: 'plan-4', subject: 'Self-Care', task: 'Mindful 20-min evening walk or stretching break (No screens!)', durationMin: 20, completed: false, scheduledTime: '05:30 PM' },
    { id: 'plan-5', subject: 'Physics', task: 'Formula sheet flashcards review before winding down', durationMin: 30, completed: false, scheduledTime: '08:00 PM' }
  ]
};

const LOCAL_MOCK_TESTS: Record<string, MockTest[]> = {
  'student-1': [
    { id: 'mt-1', title: 'JEE Main Full Test #4 (Allen/Resonance Series)', date: '2026-10-22', score: 218, totalMarks: 300, percentile: 98.4, rank: 142, notes: 'Maths integration was time-consuming. Need better pacing.' },
    { id: 'mt-2', title: 'JEE Main Full Test #3', date: '2026-10-15', score: 204, totalMarks: 300, percentile: 97.2, rank: 210, notes: 'Coordination compounds formula slip.' },
    { id: 'mt-3', title: 'Part Syllabus Test (Mechanics & Organic)', date: '2026-10-08', score: 232, totalMarks: 300, percentile: 99.1, rank: 85, notes: 'Strong grasp in mechanics.' }
  ]
};

const LOCAL_MISTAKES: Record<string, MistakeEntry[]> = {
  'student-1': [
    { id: 'err-1', subject: 'Mathematics', topic: 'Definite Integrals', errorType: 'Calculation Mistake', description: 'Substituted upper limit incorrectly in step 4 with negative sign omitted.', solutionKey: 'Always double bracket negative boundaries.', date: '2026-10-22', reviewed: false },
    { id: 'err-2', subject: 'Physics', topic: 'Rotational Motion', errorType: 'Conceptual Error', description: 'Confused torque about center of mass vs instantaneous center of zero velocity.', solutionKey: 'First write the axis of reference explicitly before writing tau = I * alpha.', date: '2026-10-22', reviewed: true },
    { id: 'err-3', subject: 'Chemistry', topic: 'Electrochemical Series', errorType: 'Silly Error', description: 'Mixed up anode reduction potential vs oxidation potential polarity.', solutionKey: 'Standard convention always uses reduction potentials: E_cell = E_cathode - E_anode.', date: '2026-10-15', reviewed: true }
  ]
};

const LOCAL_BACKLOGS: Record<string, BacklogItem[]> = {
  'student-1': [
    { id: 'bg-1', subject: 'Mathematics', chapter: 'Probability & Bayes Theorem', urgency: 'High', estimatedHours: 4.5, notes: 'Missed class due to seasonal flu.', completed: false },
    { id: 'bg-2', subject: 'Chemistry', chapter: 'Surface Chemistry & Colloids', urgency: 'Medium', estimatedHours: 2.5, notes: 'NCERT line-by-line reading remaining.', completed: false },
    { id: 'bg-3', subject: 'Physics', chapter: 'Wave Optics (Polarization & Resolving Power)', urgency: 'Low', estimatedHours: 2, notes: 'Quick formula revision needed.', completed: true }
  ]
};

const LOCAL_REVISION: Record<string, RevisionItem[]> = {
  'student-1': [
    { id: 'rev-1', subject: 'Physics', topic: 'Electrostatics & Gauss Law', interval: 'Day 21 Review', dueDate: 'Tomorrow', status: 'Due Soon' },
    { id: 'rev-2', subject: 'Chemistry', topic: 'Aldehydes & Ketones Reaction Mechanisms', interval: 'Day 7 Review', dueDate: 'Today', status: 'Due Today' },
    { id: 'rev-3', subject: 'Mathematics', topic: 'Conic Sections: Parabola properties', interval: 'Day 3 Review', dueDate: 'In 3 days', status: 'Upcoming' }
  ]
};

const LOCAL_MOOD_LOGS: Record<string, MoodLog[]> = {
  'student-1': [
    { date: '2026-10-27', mood: 'Stressed', level: 3, energy: 3, note: 'Mock test coming up this weekend. Nervous about math pace.', tags: ['Mock Anxiety'] },
    { date: '2026-10-26', mood: 'Good', level: 4, energy: 4, note: 'Completed physics PYQs on time. Felt accomplished!', tags: ['Productive', 'Calm'] },
    { date: '2026-10-25', mood: 'Okay', level: 3, energy: 3, note: 'Average day. Took a 15 min walk after dinner.', tags: ['Balanced'] },
    { date: '2026-10-24', mood: 'Exhausted', level: 2, energy: 2, note: 'Late night study drained me. Need to prioritize 7 hours sleep.', tags: ['Tired'] },
    { date: '2026-10-23', mood: 'Great', level: 5, energy: 4, note: 'Good group study session with Rohit. Cleared doubts.', tags: ['Supported'] }
  ]
};

const LOCAL_ASSESSMENTS: Record<string, WellbeingAssessment[]> = {
  'student-1': [
    {
      id: 'wb-1',
      date: '2026-10-25',
      scores: { mood: 3, stress: 4, sleep: 3, energy: 3, socialConnection: 3, academicPressure: 4, supportAccess: 4 },
      overallIndex: 64,
      summaryFeedback: 'You are managing a heavy academic workload with commendable dedication, but elevated stress and slight sleep deficit are noticeable. Pacing yourself and honoring 7-hour sleep will actually enhance memory consolidation.',
      recommendation: 'Consider scheduling a relaxing 20-minute wind-down routine before sleep and talking to a mentor if math pacing continues to trigger anxiety.',
      consultationSuggested: false
    }
  ]
};

const LOCAL_JOURNAL: Record<string, JournalEntry[]> = {
  'student-1': [
    {
      id: 'jr-1',
      date: '2026-10-26T21:45:00Z',
      title: 'Letting go of comparison today',
      content: 'In coaching class, sir praised two students who finished the test in 2 hours. For 10 minutes I felt a knot in my stomach. But then I reminded myself: their path is theirs, mine is mine. I improved my mechanics accuracy by 15% this month. That is real progress.',
      tags: ['Growth Mindset', 'Self-Compassion'],
      mood: 'Calm'
    }
  ]
};

const LOCAL_COUNSELLORS: Counsellor[] = [
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

const LOCAL_TEACHERS: TeacherContact[] = [
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
];

const LOCAL_CHARACTERS: CompanionCharacter[] = [
  {
    id: 'champion_ronaldo',
    name: 'Champion Spirit (Inspired by CR7)',
    tagline: 'High energy, relentless discipline, and resilience',
    avatar: '⚡',
    color: 'from-amber-500 to-red-600',
    greeting: "Siuuu! Keep your head up, champion! Great battles aren't won without pressure. Tell me: what hurdle are we tackling today? Let's turn stress into strength!",
    systemPrompt: 'Cristiano Ronaldo inspired motivational mentor'
  },
  {
    id: 'mickey_pal',
    name: 'Cheerful Pal (Inspired by Mickey)',
    tagline: 'Warm, playful, and cheerful optimism',
    avatar: '🎈',
    color: 'from-rose-500 to-orange-400',
    greeting: "Oh boy! It's so wonderful to see you today, pal! Remember, no tricky math problem or giant chapter is too big when we take it one friendly step at a time. What are we exploring today?",
    systemPrompt: 'Mickey Mouse inspired cheerful companion'
  },
  {
    id: 'anime_sensei',
    name: 'Inspiring Anime Sensei',
    tagline: 'Wise perseverance and training-arc philosophy',
    avatar: '⚔️',
    color: 'from-purple-600 to-indigo-700',
    greeting: "Welcome, young scholar. Every great protagonist faces moments where the mountain seems insurmountable. Remember: this exam is merely one training arc in your epic story. What challenge is testing your spirit today?",
    systemPrompt: 'Anime mentor'
  },
  {
    id: 'supportive_mentor',
    name: 'Supportive Mentor',
    tagline: 'Calm, empathetic, and grounded guidance',
    avatar: '🌱',
    color: 'from-emerald-500 to-teal-600',
    greeting: "Hello there! I'm here as your supportive mentor. Whether exam pressure feels overwhelming today or you just need a quiet space to reflect, I'm listening. What's on your mind?",
    systemPrompt: 'Supportive mentor'
  },
  {
    id: 'calm_friend',
    name: 'Calm, Thoughtful Friend',
    tagline: 'A gentle, patient listening ear with zero judgment',
    avatar: '☕',
    color: 'from-sky-500 to-blue-600',
    greeting: "Hey, take a slow breath. You don't have to put on a brave face here. How are you really feeling today beneath all the study deadlines?",
    systemPrompt: 'Calm friend'
  },
  {
    id: 'funny_sidekick',
    name: 'Funny Sidekick',
    tagline: 'Witty humor and lighthearted tension relief',
    avatar: '😄',
    color: 'from-yellow-400 to-amber-500',
    greeting: "Look, between you and me, whoever invented 3D coordinate geometry definitely woke up on the wrong side of the bed. But we're going to survive it! What's currently stressing you out?",
    systemPrompt: 'Funny sidekick'
  },
  {
    id: 'wise_teacher',
    name: 'Wise Teacher',
    tagline: 'Patient, structured pedagogy and conceptual clarity',
    avatar: '📚',
    color: 'from-teal-600 to-cyan-700',
    greeting: "Good day, student. Remember that true mastery is built brick by brick, not in a rushed marathon. What topic or study thought would you like to untangle together?",
    systemPrompt: 'Wise teacher'
  },
  {
    id: 'custom',
    name: 'Custom Companion',
    tagline: 'Personalized character created by you',
    avatar: '✨',
    color: 'from-fuchsia-500 to-pink-600',
    greeting: "Greetings! I'm here in the character style you requested. How can I support your study mindset and wellbeing today?",
    systemPrompt: 'Custom companion'
  }
];

const LOCAL_GOALS: ConversationGoal[] = [
  { id: 'exam_stress', label: 'Exam Stress & Panic', icon: '😰', description: 'Techniques to calm test anxiety and regain clear thinking' },
  { id: 'loneliness', label: 'Feeling Lonely / Isolated', icon: '🫂', description: 'A safe space to share feelings when you feel disconnected' },
  { id: 'motivation', label: 'Motivation & Confidence', icon: '🔥', description: 'Reignite self-belief and break through procrastination' },
  { id: 'burnout', label: 'Academic Burnout & Fatigue', icon: '🔋', description: 'Recognize exhaustion, guilt-free rest, and recovery pacing' },
  { id: 'emotions', label: 'Managing Difficult Emotions', icon: '🌊', description: 'Navigating frustration, sadness, or fear of failure' },
  { id: 'calm_break', label: 'Taking a Calming Break', icon: '🌿', description: 'Quick grounding, mindful breathing, and reset games' },
  { id: 'general', label: 'General Conversation', icon: '💬', description: 'Friendly check-in, talking about your day or thoughts' }
];

const LOCAL_STARTERS: Record<string, string[]> = {
  exam_stress: [
    "I have a mock test in 2 days and my heart starts pounding every time I open the formula book.",
    "I feel like my syllabus is too huge and time is slipping away.",
    "How do I stop blanking out during timed mock tests?"
  ],
  loneliness: [
    "All my school friends seem to have their lives sorted, and I feel completely alone preparing in my room.",
    "I haven't talked to anyone outside my family for weeks because of coaching.",
    "It feels like no one really understands the pressure I'm under."
  ],
  motivation: [
    "I scored lower than expected in my last test and lost all my motivation.",
    "I keep sitting at my desk staring at the chapter but can't focus.",
    "Remind me why I started this journey."
  ],
  burnout: [
    "I'm studying 10 hours a day but my brain feels like cotton candy and nothing is going in.",
    "I feel guilty every time I take a 15-minute break to rest.",
    "How do I know if I'm burning out or just being lazy?"
  ],
  emotions: [
    "I'm terrified of letting my parents down after all their sacrifices.",
    "I feel angry at myself for making silly mistakes in my exam.",
    "How can I stop comparing my scores to my batchmates?"
  ],
  calm_break: [
    "Can you guide me through a 2-minute calming breathing thought?",
    "Tell me an uplifting story about someone who overcame setbacks.",
    "What's a relaxing 5-minute activity I can do right now without checking my phone?"
  ],
  general: [
    "Just wanted to say hi and talk through my study plan for this evening.",
    "How can I build better sleep habits before 11 PM?",
    "What is the best way to handle revision without feeling overwhelmed?"
  ]
};

// Local distress & crisis keyword detector
const CRISIS_PATTERNS = [
  /kill\s*(myself|me)/i,
  /suicid(e|al)/i,
  /end\s*(my\s*)?life/i,
  /want\s*to\s*die/i,
  /better\s*off\s*dead/i,
  /can'?t\s*go\s*on\s*anymore/i,
  /no\s*reason\s*to\s*live/i,
  /harm(ing)?\s*myself/i,
  /end\s*it\s*all/i
];

function localGenerateCompanionReply(characterId: string, customDetails: any, goal: string, message: string) {
  const isCrisis = CRISIS_PATTERNS.some(regex => regex.test(message));
  if (isCrisis) {
    return {
      isCrisis: true,
      reply: `I hear how overwhelmingly painful and heavy things feel right now. Please know this: your life and your safety matter far beyond any test, score, or expectation. You do not have to carry this immense weight alone.\n\nPlease reach out right now to a trusted adult, family member, or contact Tele-MANAS immediately at 14416 (toll-free, 24x7). Caring, trained human counsellors are ready to support you without judgment.`,
      helplines: [
        { name: 'Tele-MANAS (Govt of India)', number: '14416 / 1800-891-4416', hours: '24x7 Toll-Free', description: 'Free confidential tele mental health support' },
        { name: 'KIRAN Mental Health Helpline', number: '1800-599-0019', hours: '24x7 Toll-Free', description: 'Govt of India psychological first aid' }
      ]
    };
  }

  const lower = message.toLowerCase();
  let prefix = "";
  let closing = "";

  if (characterId === 'champion_ronaldo') {
    prefix = "Siuuu! Listen to me, champion. ";
    closing = "\n\nDrink some water, take 5 deep breaths, and let's conquer this next small step. You've got the talent and the grit!";
  } else if (characterId === 'mickey_pal') {
    prefix = "Oh boy, pal! ";
    closing = "\n\nGive yourself a gentle high five right now—you're doing much better than you give yourself credit for, honest!";
  } else if (characterId === 'anime_sensei') {
    prefix = "Hear me well, young scholar. ";
    closing = "\n\nBreathe in deeply. Center your inner resolve. The training arc continues, and I stand with you.";
  } else if (characterId === 'calm_friend') {
    prefix = "Hey... ";
    closing = "\n\nTake your time. You don't have to prove anything to me right now. I'm right here with you.";
  } else if (characterId === 'funny_sidekick') {
    prefix = "Okay, real talk! ";
    closing = "\n\nSo let's agree: you are doing awesome for surviving this circus. Now, take a sip of water and let's tackle this like two mastermind conspirators!";
  } else if (characterId === 'wise_teacher') {
    prefix = "Let us pause and examine this calmly. ";
    closing = "\n\nFocus on the next single concept, not the entire horizon. Understanding one small truth today is a victory.";
  } else if (characterId === 'custom' && customDetails?.name) {
    prefix = `[${customDetails.name}]: `;
    closing = `\n\nStay focused on your journey and remember to honor your wellbeing.`;
  } else {
    prefix = "Thank you for sharing that with me. ";
    closing = "\n\nRemember to treat yourself with the same kindness you'd give a close friend.";
  }

  let advice = "";
  if (lower.includes('mock') || lower.includes('score') || lower.includes('marks')) {
    advice = "Mock tests are diagnostic thermometers, not final verdicts on your intelligence or your destiny. When a score drops, it simply highlights 3 or 4 specific conceptual leaks to patch in your Mistake Notebook. It doesn't mean your dream is out of reach—it's giving you the exact blueprint of what to revise.";
  } else if (lower.includes('sleep') || lower.includes('tired') || lower.includes('exhausted')) {
    advice = "Neuroscience shows that long-term memory consolidation in Physics, Biology, and Math happens strictly during slow-wave sleep. Cutting sleep from 7 hours to 4 hours reduces cognitive recall by up to 35%. Sleeping is not 'wasted study time'—it is active preparation!";
  } else if (lower.includes('alone') || lower.includes('lonely') || lower.includes('isolated')) {
    advice = "Competitive exam prep can feel like living on an isolated island while the rest of the world goes on. But even a 10-minute phone call with an old friend or a brief tea break with family can replenish your emotional tank.";
  } else {
    advice = "When anxiety spikes, your nervous system is simply trying to protect you. Try the 4-7-8 breath: inhale gently through the nose for 4 seconds, hold for 7 seconds, and slowly exhale through the mouth for 8 seconds. Notice how your shoulders drop and your clarity returns.";
  }

  return {
    isCrisis: false,
    reply: `${prefix}${advice}${closing}`,
    character: LOCAL_CHARACTERS.find(c => c.id === characterId) || LOCAL_CHARACTERS[0],
    poweredBy: 'MindSpring Instant Browser Companion'
  };
}

// Helper to safely execute fetch with same-origin credentials for HttpOnly cookies
async function safeFetch<T>(url: string, options?: RequestInit, fallback?: () => T): Promise<T> {
  try {
    const res = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(options?.headers || {})
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Not JSON');
    }
    return await res.json();
  } catch (err) {
    if (fallback) return fallback();
    throw err;
  }
}

// ================= API CLIENT WITH AUTOMATIC GITHUB PAGES FALLBACK =================
export const api = {
  // Auth & Sessions
  async bootstrapDemoSession(userId?: string, role?: string): Promise<{ success: boolean; user: User }> {
    const res = await safeFetch<{ success: boolean; user: User }>(`${API_BASE}/auth/demo-bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    if (res?.user) currentUser = res.user;
    return res;
  },

  async login(credentials: { email?: string; password?: string; userId?: string }): Promise<{ success: boolean; user: User }> {
    const res = await safeFetch<{ success: boolean; user: User }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (res?.user) currentUser = res.user;
    return res;
  },

  async register(data: {
    name: string;
    email: string;
    password?: string;
    ageGroup?: string;
    examGoal?: string;
    subjects?: string[];
    dailyTargetHours?: number;
    parentConsent?: boolean;
  }): Promise<{ success: boolean; user: User }> {
    const res = await safeFetch<{ success: boolean; user: User }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res?.user) currentUser = res.user;
    return res;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    currentUser = LOCAL_USERS[0];
    return safeFetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async getDemoUsers(): Promise<{ users: User[] }> {
    return safeFetch(`${API_BASE}/auth/demo-users`, undefined, () => ({ users: LOCAL_USERS }));
  },

  async getCurrentUser(): Promise<{ user: User | null }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.status === 401) {
      return { user: null };
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data?.user) currentUser = data.user;
    return { user: data.user || null };
  },

  async switchRole(role: string, userId?: string): Promise<{ success: boolean; user: User }> {
    const res = await safeFetch<{ success: boolean; user: User }>(`${API_BASE}/auth/switch-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, userId })
    });
    if (res?.user) currentUser = res.user;
    return res;
  },

  async updateConsent(consentGiven: boolean, emergencyContact: any): Promise<{ success: boolean; user: User }> {
    return safeFetch(`${API_BASE}/auth/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentGiven, emergencyContact })
    });
  },

  // To-Do Planner API
  async getTodoTasks(studentId?: string, query?: { date?: string; month?: string }): Promise<{ tasks: TodoTask[] }> {
    const key = studentId || currentUser.id || 'student-1';
    const queryParams = new URLSearchParams();
    if (query?.date) queryParams.set('date', query.date);
    if (query?.month) queryParams.set('month', query.month);
    queryParams.set('studentId', key);

    return safeFetch(`${API_BASE}/academic/tasks?${queryParams.toString()}`, undefined, () => {
      let list = LOCAL_TODO_TASKS[key] || LOCAL_TODO_TASKS['student-1'] || [];
      if (query?.date) {
        list = list.filter(t => t.date === query.date);
      } else if (query?.month) {
        list = list.filter(t => t.date.startsWith(query.month!));
      }
      return { tasks: [...list] };
    });
  },

  async addTodoTask(data: Partial<TodoTask>, studentId?: string): Promise<{ success: boolean; task: TodoTask }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, ...(studentId ? { studentId } : {}) })
    }, () => {
      if (!LOCAL_TODO_TASKS[key]) LOCAL_TODO_TASKS[key] = [];
      const newTask: TodoTask = {
        id: `task-${Date.now()}`,
        studentId: key,
        title: data.title || 'Untitled Task',
        description: data.description || '',
        date: data.date || new Date().toISOString().split('T')[0],
        startTime: data.startTime || '10:00',
        priority: data.priority || 'medium',
        category: data.category || 'Study',
        reminderMinutesBefore: data.reminderMinutesBefore !== undefined ? data.reminderMinutesBefore : 10,
        completed: false,
        createdAt: new Date().toISOString(),
        notified: false
      };
      LOCAL_TODO_TASKS[key].unshift(newTask);
      persistLocalTodoTasks();
      return { success: true, task: newTask };
    });
  },

  async updateTodoTask(taskId: string, updates: Partial<TodoTask>, studentId?: string): Promise<{ success: boolean; task: TodoTask }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, studentId: key })
    }, () => {
      const list = LOCAL_TODO_TASKS[key] || LOCAL_TODO_TASKS['student-1'] || [];
      const idx = list.findIndex(t => t.id === taskId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates, id: taskId };
        persistLocalTodoTasks();
        return { success: true, task: list[idx] };
      }
      throw new Error('Task not found');
    });
  },

  async deleteTodoTask(taskId: string, studentId?: string): Promise<{ success: boolean }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/tasks/${taskId}?studentId=${key}`, {
      method: 'DELETE'
    }, () => {
      if (LOCAL_TODO_TASKS[key]) {
        LOCAL_TODO_TASKS[key] = LOCAL_TODO_TASKS[key].filter(t => t.id !== taskId);
        persistLocalTodoTasks();
      }
      return { success: true };
    });
  },

  async toggleTodoTask(taskId: string, studentId?: string): Promise<{ success: boolean; task: TodoTask }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/tasks/toggle?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, studentId: key })
    }, () => {
      const list = LOCAL_TODO_TASKS[key] || LOCAL_TODO_TASKS['student-1'] || [];
      const task = list.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        persistLocalTodoTasks();
        return { success: true, task };
      }
      throw new Error('Task not found');
    });
  },

  async rescheduleTodoTask(taskId: string, newDate: string, studentId?: string): Promise<{ success: boolean; task: TodoTask }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/tasks/${taskId}/reschedule?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, studentId: key })
    }, () => {
      const list = LOCAL_TODO_TASKS[key] || LOCAL_TODO_TASKS['student-1'] || [];
      const task = list.find(t => t.id === taskId);
      if (task) {
        task.date = newDate;
        task.notified = false;
        persistLocalTodoTasks();
        return { success: true, task };
      }
      throw new Error('Task not found');
    });
  },

  // Legacy compatibility for tasks
  async getTasks(studentId?: string): Promise<{ tasks: StudyTask[] }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/tasks?studentId=${key}`, undefined, () => ({
      tasks: LOCAL_TASKS[key] || LOCAL_TASKS['student-1']
    }));
  },

  async toggleTask(taskId: string, studentId?: string): Promise<{ success: boolean; task: StudyTask }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/tasks/toggle?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId })
    }, () => {
      const list = LOCAL_TASKS[key] || LOCAL_TASKS['student-1'];
      const task = list.find(t => t.id === taskId);
      if (task) task.completed = !task.completed;
      return { success: true, task: task! };
    });
  },

  async addTask(data: { subject: string; task: string; durationMin: number; scheduledTime: string }, studentId?: string): Promise<{ success: boolean; task: StudyTask }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/tasks?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      if (!LOCAL_TASKS[key]) LOCAL_TASKS[key] = [];
      const newTask: StudyTask = {
        id: `plan-${Date.now()}`,
        subject: data.subject,
        task: data.task,
        durationMin: data.durationMin,
        completed: false,
        scheduledTime: data.scheduledTime
      };
      LOCAL_TASKS[key].push(newTask);
      return { success: true, task: newTask };
    });
  },

  async getMockTests(studentId?: string): Promise<{ tests: MockTest[] }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/mock-tests?studentId=${key}`, undefined, () => ({
      tests: LOCAL_MOCK_TESTS[key] || LOCAL_MOCK_TESTS['student-1']
    }));
  },

  async addMockTest(testData: Partial<MockTest>, studentId?: string): Promise<{ success: boolean; test: MockTest }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/mock-tests?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    }, () => {
      if (!LOCAL_MOCK_TESTS[key]) LOCAL_MOCK_TESTS[key] = [];
      const newTest: MockTest = {
        id: `mt-${Date.now()}`,
        title: testData.title || 'Full Mock Test',
        date: new Date().toISOString().split('T')[0],
        score: Number(testData.score) || 0,
        totalMarks: Number(testData.totalMarks) || 300,
        percentile: Number(testData.percentile) || 95,
        rank: Number(testData.rank) || 200,
        notes: testData.notes || ''
      };
      LOCAL_MOCK_TESTS[key].unshift(newTest);
      return { success: true, test: newTest };
    });
  },

  async getMistakes(studentId?: string): Promise<{ mistakes: MistakeEntry[] }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/mistakes?studentId=${key}`, undefined, () => ({
      mistakes: LOCAL_MISTAKES[key] || LOCAL_MISTAKES['student-1']
    }));
  },

  async addMistake(mistakeData: Partial<MistakeEntry>, studentId?: string): Promise<{ success: boolean; mistake: MistakeEntry }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/mistakes?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mistakeData)
    }, () => {
      if (!LOCAL_MISTAKES[key]) LOCAL_MISTAKES[key] = [];
      const newMistake: MistakeEntry = {
        id: `err-${Date.now()}`,
        subject: mistakeData.subject || 'Physics',
        topic: mistakeData.topic || 'General Concept',
        errorType: mistakeData.errorType || 'Conceptual Error',
        description: mistakeData.description || '',
        solutionKey: mistakeData.solutionKey || '',
        date: new Date().toISOString().split('T')[0],
        reviewed: false
      };
      LOCAL_MISTAKES[key].unshift(newMistake);
      return { success: true, mistake: newMistake };
    });
  },

  async toggleMistake(mistakeId: string, studentId?: string): Promise<{ success: boolean; item: MistakeEntry }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/mistakes/toggle?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mistakeId })
    }, () => {
      const list = LOCAL_MISTAKES[key] || LOCAL_MISTAKES['student-1'];
      const m = list.find(i => i.id === mistakeId);
      if (m) m.reviewed = !m.reviewed;
      return { success: true, item: m! };
    });
  },

  async getBacklogs(studentId?: string): Promise<{ backlogs: BacklogItem[] }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/backlogs?studentId=${key}`, undefined, () => ({
      backlogs: LOCAL_BACKLOGS[key] || LOCAL_BACKLOGS['student-1']
    }));
  },

  async addBacklog(backlogData: Partial<BacklogItem>, studentId?: string): Promise<{ success: boolean; backlog: BacklogItem }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/backlogs?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backlogData)
    }, () => {
      if (!LOCAL_BACKLOGS[key]) LOCAL_BACKLOGS[key] = [];
      const newBacklog: BacklogItem = {
        id: `bg-${Date.now()}`,
        subject: backlogData.subject || 'Mathematics',
        chapter: backlogData.chapter || 'Untitled Topic',
        urgency: backlogData.urgency || 'Medium',
        estimatedHours: Number(backlogData.estimatedHours) || 2,
        notes: backlogData.notes || '',
        completed: false
      };
      LOCAL_BACKLOGS[key].push(newBacklog);
      return { success: true, backlog: newBacklog };
    });
  },

  async toggleBacklog(backlogId: string, studentId?: string): Promise<{ success: boolean; item: BacklogItem }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/backlogs/toggle?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backlogId })
    }, () => {
      const list = LOCAL_BACKLOGS[key] || LOCAL_BACKLOGS['student-1'];
      const b = list.find(i => i.id === backlogId);
      if (b) b.completed = !b.completed;
      return { success: true, item: b! };
    });
  },

  async getRevision(studentId?: string): Promise<{ revisionSchedule: RevisionItem[] }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/academic/revision?studentId=${key}`, undefined, () => ({
      revisionSchedule: LOCAL_REVISION[key] || LOCAL_REVISION['student-1']
    }));
  },

  // Wellbeing
  async getAssessments(studentId?: string): Promise<{ assessments: WellbeingAssessment[]; disclaimer: string }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/wellbeing/assessment?studentId=${key}`, undefined, () => ({
      assessments: LOCAL_ASSESSMENTS[key] || LOCAL_ASSESSMENTS['student-1'],
      disclaimer: 'The MindSpring Wellbeing Reflection is a self-care check-in tool. It is strictly non-diagnostic.'
    }));
  },

  async submitAssessment(data: any, studentId?: string): Promise<{ success: boolean; assessment: WellbeingAssessment }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/wellbeing/assessment?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const posScore = (Number(data.mood) || 3) + (Number(data.sleep) || 3) + (Number(data.energy) || 3) + (Number(data.socialConnection) || 3) + (Number(data.supportAccess) || 3);
      const negScore = (Number(data.stress) || 3) + (Number(data.academicPressure) || 3);
      const normalizedIndex = Math.round(Math.min(100, Math.max(10, ((posScore * 2) + (12 - negScore) * 3))));

      const newAssessment: WellbeingAssessment = {
        id: `wb-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        scores: {
          mood: Number(data.mood) || 3,
          stress: Number(data.stress) || 3,
          sleep: Number(data.sleep) || 3,
          energy: Number(data.energy) || 3,
          socialConnection: Number(data.socialConnection) || 3,
          academicPressure: Number(data.academicPressure) || 3,
          supportAccess: Number(data.supportAccess) || 3
        },
        overallIndex: normalizedIndex,
        summaryFeedback: normalizedIndex >= 70 
          ? 'Your emotional stamina and rest rhythms look strong this week. Keep protecting your recovery intervals.'
          : 'You are carrying significant exam responsibilities. Notice where you might be cutting into sleep or hydration.',
        recommendation: 'Try scheduling a 20-minute relaxation block every evening with zero screens or formula books.',
        consultationSuggested: normalizedIndex < 50
      };

      if (!LOCAL_ASSESSMENTS[key]) LOCAL_ASSESSMENTS[key] = [];
      LOCAL_ASSESSMENTS[key].unshift(newAssessment);
      return { success: true, assessment: newAssessment };
    });
  },

  async getMoods(studentId?: string): Promise<{ moodHistory: MoodLog[] }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/wellbeing/mood?studentId=${key}`, undefined, () => ({
      moodHistory: LOCAL_MOOD_LOGS[key] || LOCAL_MOOD_LOGS['student-1']
    }));
  },

  async logMood(data: Partial<MoodLog>, studentId?: string): Promise<{ success: boolean; mood: MoodLog }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/wellbeing/mood?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      if (!LOCAL_MOOD_LOGS[key]) LOCAL_MOOD_LOGS[key] = [];
      const newMood: MoodLog = {
        date: new Date().toISOString().split('T')[0],
        mood: (data.mood as any) || 'Okay',
        level: Number(data.level) || 3,
        energy: Number(data.energy) || 3,
        note: data.note || '',
        tags: data.tags || []
      };
      LOCAL_MOOD_LOGS[key].unshift(newMood);
      return { success: true, mood: newMood };
    });
  },

  async getJournal(studentId?: string): Promise<{ entries: JournalEntry[]; privacyNotice: string }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/wellbeing/journal?studentId=${key}`, undefined, () => ({
      entries: LOCAL_JOURNAL[key] || LOCAL_JOURNAL['student-1'],
      privacyNotice: 'Your journal is strictly private to you. MindSpring never shares journal text without explicit consent.'
    }));
  },

  async addJournal(data: Partial<JournalEntry>, studentId?: string): Promise<{ success: boolean; entry: JournalEntry }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/wellbeing/journal?studentId=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      if (!LOCAL_JOURNAL[key]) LOCAL_JOURNAL[key] = [];
      const newEntry: JournalEntry = {
        id: `jr-${Date.now()}`,
        date: new Date().toISOString(),
        title: data.title || 'Mindful Reflection',
        content: data.content || '',
        tags: data.tags || ['Reflection'],
        mood: data.mood || 'Calm'
      };
      LOCAL_JOURNAL[key].unshift(newEntry);
      return { success: true, entry: newEntry };
    });
  },

  async deleteJournal(id: string, studentId?: string): Promise<{ success: boolean }> {
    const key = studentId || currentUser.id || 'student-1';
    return safeFetch(`${API_BASE}/wellbeing/journal/${id}?studentId=${key}`, { method: 'DELETE' }, () => {
      const list = LOCAL_JOURNAL[key] || LOCAL_JOURNAL['student-1'];
      const idx = list.findIndex(e => e.id === id);
      if (idx >= 0) list.splice(idx, 1);
      return { success: true };
    });
  },

  // AI Companion
  async getCharacters(): Promise<{ characters: CompanionCharacter[] }> {
    return safeFetch(`${API_BASE}/companion/characters`, undefined, () => ({ characters: LOCAL_CHARACTERS }));
  },

  async getGoals(): Promise<{ goals: ConversationGoal[] }> {
    return safeFetch(`${API_BASE}/companion/goals`, undefined, () => ({ goals: LOCAL_GOALS }));
  },

  async getStarters(goal?: string): Promise<{ starters: any }> {
    return safeFetch(`${API_BASE}/companion/starters${goal ? `?goal=${goal}` : ''}`, undefined, () => ({
      starters: goal && LOCAL_STARTERS[goal] ? LOCAL_STARTERS[goal] : LOCAL_STARTERS
    }));
  },

  async sendCompanionChat(data: {
    characterId: string;
    customDetails?: { name?: string; style?: string; description?: string };
    goal: string;
    message: string;
    history: any[];
  }): Promise<any> {
    return safeFetch(`${API_BASE}/companion/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      return localGenerateCompanionReply(data.characterId, data.customDetails, data.goal, data.message);
    });
  },

  // Support & Safeguarding
  async getTrustedAdult(studentId?: string): Promise<any> {
    return safeFetch(`${API_BASE}/support/trusted-adult`, undefined, () => ({
      trustedAdult: currentUser.emergencyContact || null,
      info: 'Your trusted adult is notified only upon your explicit directive or in immediate life-safety emergencies.'
    }));
  },

  async updateTrustedAdult(data: any, studentId?: string): Promise<any> {
    return safeFetch(`${API_BASE}/support/trusted-adult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      currentUser.emergencyContact = data;
      return { success: true, emergencyContact: data };
    });
  },

  async getCounsellors(): Promise<{ counsellors: Counsellor[]; notice: string }> {
    return safeFetch(`${API_BASE}/support/counsellors`, undefined, () => ({
      counsellors: LOCAL_COUNSELLORS,
      notice: 'All counsellors are certified mental health professionals registered with relevant councils.'
    }));
  },

  async getRequests(studentId?: string): Promise<{ requests: ConsultationRequest[] }> {
    return safeFetch(`${API_BASE}/support/requests`, undefined, () => ({ requests: [] }));
  },

  async bookSession(data: any): Promise<any> {
    return safeFetch(`${API_BASE}/support/book-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, () => {
      const c = LOCAL_COUNSELLORS.find(item => item.id === data.counsellorId) || LOCAL_COUNSELLORS[0];
      const newReq: ConsultationRequest = {
        id: `req-${Date.now()}`,
        studentId: currentUser.id,
        studentName: currentUser.name,
        counsellorId: c.id,
        counsellorName: c.name,
        reason: data.reason,
        preferredSlot: data.preferredSlot,
        status: 'Pending Review',
        createdAt: new Date().toISOString(),
        confidentialNotes: 'Confidential request submitted by student.'
      };
      return { success: true, request: newReq };
    });
  },

  async getCrisisHelplines(): Promise<any> {
    return safeFetch(`${API_BASE}/support/crisis-helplines`, undefined, () => ({
      helplines: [
        { name: 'Tele-MANAS (Govt of India)', number: '14416 / 1800-891-4416', hours: '24x7 Toll-Free' },
        { name: 'KIRAN Helpline', number: '1800-599-0019', hours: '24x7 Toll-Free' }
      ]
    }));
  },

  // Student's Teacher Contacts
  async getTeachers(studentId?: string): Promise<{ teachers: TeacherContact[] }> {
    return safeFetch(`${API_BASE}/support/teachers`, undefined, () => ({ teachers: LOCAL_TEACHERS }));
  },

  async addTeacher(teacherData: Partial<TeacherContact>, studentId?: string): Promise<{ success: boolean; teacher: TeacherContact }> {
    return safeFetch(`${API_BASE}/support/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData)
    }, () => {
      const newTeacher: TeacherContact = {
        id: `tch-${Date.now()}`,
        name: teacherData.name || 'Teacher / Mentor',
        subject: teacherData.subject || 'Subject Guide',
        schoolOrCoaching: teacherData.schoolOrCoaching || 'School / Coaching',
        phone: teacherData.phone || '',
        email: teacherData.email || '',
        availableHours: teacherData.availableHours || 'By appointment',
        notes: teacherData.notes || '',
        isTrustedMentor: Boolean(teacherData.isTrustedMentor)
      };
      LOCAL_TEACHERS.push(newTeacher);
      return { success: true, teacher: newTeacher };
    });
  },

  async deleteTeacher(teacherId: string, studentId?: string): Promise<{ success: boolean }> {
    return safeFetch(`${API_BASE}/support/teachers/${teacherId}`, { method: 'DELETE' }, () => {
      const idx = LOCAL_TEACHERS.findIndex(t => t.id === teacherId);
      if (idx >= 0) LOCAL_TEACHERS.splice(idx, 1);
      return { success: true };
    });
  },

  // Dashboards
  async getParentDashboard(): Promise<any> {
    return safeFetch(`${API_BASE}/dashboards/parent`, undefined, () => ({
      parentName: 'Mrs. Sunita Sharma',
      student: {
        name: 'Aarav Sharma',
        examGoal: 'JEE Main & Advanced 2027',
        studyConsistencyStreak: '14 consecutive days',
        taskSummary: `${(LOCAL_TODO_TASKS['student-1'] || []).filter(t => t.completed).length} of ${(LOCAL_TODO_TASKS['student-1'] || []).length} tasks completed today`
      },
      privacyNotice: 'Personal journal entries and confidential counsellor dialogues remain strictly between the student and certified mental health professionals.',
      parentSupportGuide: [
        { heading: 'How to ask about mock scores', recommendation: 'Ask: "How did you feel about the pacing?" instead of "What was your rank?"' },
        { heading: 'Prioritizing sleep over midnight cramming', recommendation: 'A 7-hour rested brain solves Physics problems with 30% fewer errors.' }
      ]
    }));
  },

  async getCounsellorDashboard(): Promise<any> {
    return safeFetch(`${API_BASE}/dashboards/counsellor`, undefined, () => ({
      counsellor: { name: 'Dr. Ananya Roy', license: 'RCI-CLIN-2021-9844' },
      triageQueue: []
    }));
  },

  async getAdminDashboard(): Promise<any> {
    return safeFetch(`${API_BASE}/dashboards/admin`, undefined, () => ({
      systemHealth: 'Optimal',
      activeUsersCount: LOCAL_USERS.length,
      auditLogs: [
        { id: 'log-1', timestamp: new Date().toISOString(), actorRole: 'student', action: 'SESSION_OPENED', details: 'Student accessed dashboard' }
      ]
    }));
  }
};
