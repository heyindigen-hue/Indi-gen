import cron from 'node-cron';
import { logger } from '../logger';
import { dispatchHotLeadAlerts, dispatchDailyDigest } from '../services/push';

/**
 * Push notification crons:
 *  - hot-lead alerts: every 15 min, sends one push per qualifying lead
 *  - 9 AM IST digest: 9:00 IST = 03:30 UTC
 */
export function startPushCron(): void {
  if (process.env.PUSH_CRON_DISABLED === '1') {
    logger.info('Push cron disabled via PUSH_CRON_DISABLED=1');
    return;
  }

  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await dispatchHotLeadAlerts();
      if (result.alerts > 0) logger.info(result, 'push: hot-lead alerts dispatched');
    } catch (err: any) {
      logger.error({ err: err.message }, 'push: hot-lead cron error');
    }
  });

  // 09:00 IST = 03:30 UTC (IST is UTC+5:30)
  cron.schedule('30 3 * * *', async () => {
    try {
      const result = await dispatchDailyDigest();
      logger.info(result, 'push: daily digest dispatched');
    } catch (err: any) {
      logger.error({ err: err.message }, 'push: daily digest cron error');
    }
  });

  logger.info('Push cron started (hot-lead every 15m, daily digest at 03:30 UTC = 09:00 IST)');
}
