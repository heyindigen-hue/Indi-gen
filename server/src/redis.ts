import Redis from 'ioredis';
import { config } from './config';

export const redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: null });
redis.connect().catch(() => { /* retry in background */ });

export const pub = redis.duplicate();
export const sub = redis.duplicate();
