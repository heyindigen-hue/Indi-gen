import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/indigen',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'indigen-lead-hunter-secret-2026',
  jwtExpiry: process.env.JWT_EXPIRY || '30d',
  scraperServiceUrl: process.env.SCRAPER_SERVICE_URL || 'http://localhost:8000',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:19006').split(','),
  cashfree: {
    appId: process.env.CASHFREE_APP_ID || '',
    secret: process.env.CASHFREE_SECRET_KEY || '',
    env: (process.env.CASHFREE_ENV || 'TEST') as 'TEST' | 'PRODUCTION',
    webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || '',
  },
  anthropic: { apiKey: process.env.CLAUDE_API_KEY || '' },
  signalhire: { apiKey: process.env.SIGNALHIRE_API_KEY || '' },
};
