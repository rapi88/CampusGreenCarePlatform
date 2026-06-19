// Campus Green Care Platform — Express Server Entry Point
import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { schedulerService } from './services/scheduler.service';

// Import routes
import authRoutes from './routes/auth.routes';
import treeRoutes from './routes/tree.routes';
import chatRoutes from './routes/chat.routes';
import notesRoutes from './routes/notes.routes';
import adminRoutes from './routes/admin.routes';
import debugRoutes from './routes/debug.routes';
import awardRoutes from './routes/award.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import cronRoutes from './routes/cron.routes';

const app = express();

// ── Global Middleware ────────────────────────────────────

// CORS — allow mobile app and web clients
app.use(cors({
  origin: '*', // In production, restrict to your app's domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded tree photos
// Accessible at: http://localhost:3000/uploads/trees/<filename>
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));

// ── Health Check ─────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// ── API Routes ───────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/trees', chatRoutes);   // /api/trees/:treeId/chat
app.use('/api/trees', notesRoutes);  // /api/trees/:treeId/notes
app.use('/api/users/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/award', awardRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/cron', cronRoutes);

// ── 404 Handler ──────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// ── Global Error Handler ─────────────────────────────────

app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────

// SmarterASP (and other PaaS) injects process.env.PORT dynamically.
// We must always call app.listen() — not only in development.
const port = process.env.PORT || config.port || 3000;

app.listen(port, () => {
  console.log(`
  🌿 Campus Green Care Backend
  ─────────────────────────────
  🚀 Server running on port ${port}
  📊 Environment: ${config.nodeEnv}
  🗄️  Database: PostgreSQL
  📦 Static files: /uploads
  ─────────────────────────────
  `);

  // Start cron scheduler for watering reminders
  schedulerService.start();
});

export default app;
