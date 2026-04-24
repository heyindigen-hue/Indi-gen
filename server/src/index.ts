import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const app = express();
const PORT = process.env.PORT ?? 3001;
const VERSION = process.env.npm_package_version ?? '1.0.0';

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), version: VERSION });
});

// TODO: mount auth routes
// TODO: mount lead routes
// TODO: mount admin routes
// TODO: mount webhook routes
// TODO: mount SSE routes

app.listen(PORT, () => {
  logger.info(`Indi-gen API server on :${PORT}`);
});

export default app;
