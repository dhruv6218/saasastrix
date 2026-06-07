import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { generalLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/errorHandler';
import { startCronJobs } from './services/cron';

import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import signalRoutes from './routes/signals';
import accountRoutes from './routes/accounts';
import problemRoutes from './routes/problems';
import opportunityRoutes from './routes/opportunities';
import decisionRoutes from './routes/decisions';
import artifactRoutes from './routes/artifacts';
import launchRoutes from './routes/launches';
import teamRoutes from './routes/team';
import activityRoutes from './routes/activities';
import billingRoutes from './routes/billing';
import aiRoutes from './routes/ai';

const app = express();
const PORT = parseInt(process.env.API_PORT || '3000');

// Trust proxy for rate limiting behind Replit's proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS — allow Vite dev server and deployed domain
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  'https://astrixai.app',
  'https://www.astrixai.app',
  ...(process.env.REPLIT_DEV_DOMAIN ? [`https://${process.env.REPLIT_DEV_DOMAIN}`] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Raw body capture for webhook signature verification
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), (req: any, _res, next) => {
  req.rawBody = req.body.toString();
  req.body = JSON.parse(req.rawBody);
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('[:date[iso]] :method :url :status :res[content-length] - :response-time ms'));
}

// Rate limiting
app.use('/api/', generalLimiter);

// Health check
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  ts: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
}));

// Auth
app.use('/api/auth', authRoutes);

// Billing webhook (no auth needed — signature-verified above)
app.use('/api/billing', billingRoutes);

// Workspaces (top-level)
app.use('/api/workspaces', workspaceRoutes);

// Workspace-scoped routes
app.use('/api/workspaces/:wsId/signals', signalRoutes);
app.use('/api/workspaces/:wsId/accounts', accountRoutes);
app.use('/api/workspaces/:wsId/problems', problemRoutes);
app.use('/api/workspaces/:wsId/opportunities', opportunityRoutes);
app.use('/api/workspaces/:wsId/decisions', decisionRoutes);
app.use('/api/workspaces/:wsId/artifacts', artifactRoutes);
app.use('/api/workspaces/:wsId/launches', launchRoutes);
app.use('/api/workspaces/:wsId/team', teamRoutes);
app.use('/api/workspaces/:wsId/activities', activityRoutes);
app.use('/api/workspaces/:wsId/ai', aiRoutes);

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[API] Server running on port ${PORT}`);
  console.log(`[API] Environment: ${process.env.NODE_ENV || 'development'}`);
  // Start background cron jobs
  startCronJobs();
});

export default app;
