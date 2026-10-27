import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { APP_NAME, API_PREFIX } from '@karya/shared';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { errorHandler } from './middleware/error-handler.js';
import { generalLimiter } from './middleware/rate-limit.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import { nestedSectionRouter, sectionRouter } from './routes/section.routes.js';
import taskRoutes from './routes/task.routes.js';
import labelRoutes from './routes/label.routes.js';
import searchRoutes from './routes/search.routes.js';
import userRoutes from './routes/user.routes.js';
import { startTokenCleanup, stopTokenCleanup } from './lib/token-cleanup.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security headers ──────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null, // this app may run over plain HTTP (e.g. behind no TLS on a LAN); don't force HTTPS
    },
  } : false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  crossOriginEmbedderPolicy: false, // breaks loading fonts/images from same origin in some setups
}));

// ─── Compression ───────────────────────────────────────

app.use(compression());

// ─── Rate limiting ─────────────────────────────────────

app.use(generalLimiter);

// ─── CORS ──────────────────────────────────────────────

const allowedOrigins = (process.env.CLIENT_URL ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : allowedOrigins[0],
  credentials: true,
}));

// ─── Body parsing with size limits ─────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// ─── Request logging (non-static) ──────────────────────

app.use(`${API_PREFIX}`, (req, _res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ─── Routes ────────────────────────────────────────────

// Health check with DB connectivity
app.get(`${API_PREFIX}/health`, async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      name: APP_NAME,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      db: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      name: APP_NAME,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      db: 'disconnected',
    });
  }
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/projects/:projectId/sections`, nestedSectionRouter);
app.use(`${API_PREFIX}/sections`, sectionRouter);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/labels`, labelRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

// ─── Static files (production) ─────────────────────────

if (isProduction) {
  const publicDir = path.resolve(__dirname, '../public');
  app.use(express.static(publicDir, {
    maxAge: '1y',
    immutable: true,
  }));

  // SPA fallback: serve index.html for non-API routes
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    });
  });
}

// Global error handler (must be last)
app.use(errorHandler);

// ─── Start with graceful shutdown ──────────────────────

const server = app.listen(PORT, () => {
  logger.info(`${APP_NAME} API server running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}${API_PREFIX}/health`);
});

// Start periodic token cleanup (every 6 hours)
startTokenCleanup();

// Graceful shutdown
let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`${signal} received, shutting down gracefully...`);

  stopTokenCleanup();

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (err) {
      logger.error('Error closing database connection', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    error: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', {
    error: err.message,
    stack: err.stack,
  });
  shutdown('uncaughtException');
});

export default app;
