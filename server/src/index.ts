import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './logger';
import { errorHandler } from './middleware/error';
import { ipLimit } from './middleware/rateLimit';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));
app.use(ipLimit);

app.get('/health', (_req, res) => res.json({
  status: 'ok', time: new Date().toISOString(), uptime: process.uptime(), version: '0.1.0',
}));

// Routes mounted in next task
// app.use('/api/auth', authRouter);
// app.use('/api/leads', leadsRouter);
// app.use('/api/admin', adminRouter);
// app.use('/api/webhooks', webhookRouter);
// app.use('/api/sse', sseRouter);

app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`Indi-gen API on :${config.port} (env: ${config.nodeEnv})`);
});

process.on('SIGTERM', () => { logger.info('SIGTERM, closing'); server.close(() => process.exit(0)); });

export default app;
