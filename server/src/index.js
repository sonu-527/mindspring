import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import academicRoutes from './routes/academic.js';
import wellbeingRoutes from './routes/wellbeing.js';
import companionRoutes from './routes/companion.js';
import supportRoutes from './routes/support.js';
import dashboardRoutes from './routes/dashboards.js';
import { cookieParser, authenticateSession } from './middleware/auth.js';
import { csrfProtection } from './middleware/csrf.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Reverse proxy configuration: Only trust proxy if explicitly configured for known infrastructure
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY);
}

// Allowed origins for CORS and CSRF
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];
if (process.env.APP_ORIGIN) {
  allowedOrigins.push(process.env.APP_ORIGIN);
}

if (process.env.NODE_ENV === 'production' && !process.env.APP_ORIGIN) {
  console.warn('[SECURITY WARNING] APP_ORIGIN is not set in production. Browser requests will fail CSRF origin verification.');
}

// CORS configuration supporting credentials (cookies)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'test') {
      try {
        const u = new URL(origin);
        if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
          return callback(null, true);
        }
      } catch (e) {}
    }
    return callback(null, false);
  },
  credentials: true
}));

app.use(cookieParser);
app.use(express.json());
app.use(authenticateSession);
app.use(csrfProtection);

// Request logging middleware for transparency
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/wellbeing', wellbeingRoutes);
app.use('/api/companion', companionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/dashboards', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'MindSpring Student Mental Wellness & Exam Prep',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo_key')
  });
});

// Serve client build if available
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root fallback
  app.get('/', (req, res) => {
    res.send('MindSpring Backend API is running.');
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error occurred.',
    message: err.message
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🌸 MindSpring server running on http://localhost:${PORT}`);
  });
}

export default app;
