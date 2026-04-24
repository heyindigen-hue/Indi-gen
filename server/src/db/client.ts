import { Pool, PoolConfig } from 'pg';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.PG_POOL_SIZE || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const db = new Pool(config);

db.on('error', (err) => logger.error({ err }, 'pg pool error'));

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await db.query(text, params);
    const duration = Date.now() - start;
    if (duration > 200) logger.warn({ text: text.slice(0, 80), duration }, 'slow query');
    return result.rows as T[];
  } catch (err: any) {
    logger.error({ err, text: text.slice(0, 80) }, 'query failed');
    throw err;
  }
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
