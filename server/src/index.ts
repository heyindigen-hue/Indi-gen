import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './logger';
import { errorHandler } from './middleware/error';
import { ipLimit } from './middleware/rateLimit';
import { requireAuth, requireAdmin } from './middleware/auth';

import authRouter from './routes/auth';
import leadsRouter from './routes/leads';
import scrapeRouter from './routes/scrape';
import billingRouter from './routes/billing';
import webhooksRouter from './routes/webhooks';
import adminRouter from './routes/admin';
import proposalsRouter from './routes/proposals';
import sduiRouter from './routes/sdui';
import dpdpRouter from './routes/dpdp';
import meRouter from './routes/me';
import { attachSSE } from './sse/bus';
import { startScrapeJobCron } from './cron/scrapeJob';
import { startPushCron } from './cron/pushJob';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use('/brand', express.static(path.resolve(__dirname, '../../shared/brand')));

// Webhooks BEFORE json parser (need raw body for signature verification)
app.use('/webhook', webhooksRouter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));
app.use(ipLimit);

// Health
app.get('/health', (_req, res) => res.json({
  status: 'ok', time: new Date().toISOString(), uptime: process.uptime(), version: '0.1.0',
}));

// Public
app.use('/api/auth', authRouter);
app.use('/api/public', sduiRouter);

// Auth required
app.use('/api/me', requireAuth, dpdpRouter);
app.use('/api/me', requireAuth, meRouter);
// Alias mount — customer panel calls /api/users/me/* (industry-standard path)
app.use('/api/users/me', requireAuth, dpdpRouter);
app.use('/api/users/me', requireAuth, meRouter);
app.use('/api/leads', requireAuth, leadsRouter);
app.use('/api/scrape', requireAuth, scrapeRouter);
app.use('/api/billing', requireAuth, billingRouter);

// Admin
app.use("/api/admin", requireAuth, requireAdmin, adminRouter);
app.use("/api/admin", requireAuth, requireAdmin, proposalsRouter);
app.use("/api/admin", requireAuth, requireAdmin, sduiRouter);
app.use("/api/admin", requireAuth, requireAdmin, dpdpRouter);

// SSE
app.get("/api/admin/live", requireAuth, requireAdmin, (req, res) => attachSSE(res, ['*']));
app.get('/api/me/live', requireAuth, (req: any, res) => attachSSE(res, [`user:${req.user.id}`]));

app.use(errorHandler);

startScrapeJobCron();
startPushCron();

const server = app.listen(config.port, () => {
  logger.info(`Indi-gen API on :${config.port} (env: ${config.nodeEnv})`);
});

process.on('SIGTERM', () => { logger.info('SIGTERM, closing'); server.close(() => process.exit(0)); });

export default app;

process.on('unhandledRejection', (err) => { console.error('unhandledRejection', err); });
process.on('uncaughtException', (err) => { console.error('uncaughtException', err); });
