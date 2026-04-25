import express, { Router } from 'express';
import crypto from 'crypto';
import { query, transaction } from '../db/client';
import { grantTokens } from '../services/tokens';
import { getSetting } from '../db/settings';
import { logger } from '../logger';

const router = Router();

router.post('/cashfree', express.raw({ type: '*/*' }), async (req, res) => {
  const startedAt = Date.now();
  const secret = await getSetting('cashfree_webhook_secret') || '';
  const rawBody = (req.body as Buffer).toString('utf8');
  const ts = req.get('x-webhook-timestamp') || '';
  const sig = req.get('x-webhook-signature') || '';
  const expected = crypto.createHmac('sha256', secret).update(ts + rawBody).digest('base64');
  const valid = expected === sig;

  let payload: any = {};
  try { payload = JSON.parse(rawBody); } catch {}

  await query(
    `INSERT INTO webhooks_log (direction, provider, event_type, endpoint, status_code, payload, signature_valid, duration_ms)
     VALUES ('inbound','cashfree',$1,'/webhook/cashfree',200,$2,$3,$4)`,
    [payload?.type || null, payload, valid, Date.now() - startedAt]
  );

  if (!valid) {
    logger.warn({ sig, expected: expected.slice(0, 20) }, 'cashfree webhook bad signature');
    return res.status(401).json({ error: 'bad signature' });
  }

  const eventType = payload?.type;
  const data = payload?.data || {};

  try {
    if (eventType === 'SUBSCRIPTION_PAYMENT_SUCCESS') {
      const subId = data?.subscription_details?.subscription_id;
      const subs = await query(`SELECT user_id, plan_id FROM subscriptions WHERE cashfree_subscription_id=$1`, [subId]);
      if (subs.length) {
        const plans = await query(`SELECT tokens_included FROM subscription_plans WHERE id=$1`, [subs[0].plan_id]);
        if (plans.length && plans[0].tokens_included > 0) {
          const expiresAt = new Date(Date.now() + 32 * 24 * 3600 * 1000);
          await grantTokens({
            userId: subs[0].user_id,
            amount: plans[0].tokens_included,
            source: 'subscription',
            sourceRef: subId,
            expiresAt,
            idempotencyKey: `cf:sub_pay:${data?.payment?.payment_id}`,
          });
        }
        await query(
          `UPDATE subscriptions SET status='active', current_period_start=NOW(), updated_at=NOW()
           WHERE cashfree_subscription_id=$1`,
          [subId]
        );
      }
    } else if (eventType === 'ORDER_PAID') {
      const orderId = data?.order?.order_id;
      const tokens = data?.order?.order_tags?.tokens;
      const userId = data?.order?.customer_details?.customer_id;
      if (orderId && tokens && userId) {
        await grantTokens({
          userId, amount: parseInt(tokens), source: 'topup', sourceRef: orderId,
          idempotencyKey: `cf:order:${orderId}`,
        });
      }
    } else if (eventType === 'SUBSCRIPTION_ACTIVATED') {
      const subId = data?.subscription_details?.subscription_id;
      if (subId) {
        await query(
          `UPDATE subscriptions SET status='active', updated_at=NOW() WHERE cashfree_subscription_id=$1`,
          [subId]
        );
      }
    } else if (eventType === 'SUBSCRIPTION_CANCELLED') {
      const subId = data?.subscription_details?.subscription_id;
      if (subId) {
        await query(
          `UPDATE subscriptions SET status='cancelled', cancelled_at=NOW(), updated_at=NOW()
           WHERE cashfree_subscription_id=$1`,
          [subId]
        );
      }
    } else if (eventType === 'SUBSCRIPTION_PAYMENT_FAILED') {
      const subId = data?.subscription_details?.subscription_id;
      if (subId) {
        await query(
          `UPDATE subscriptions SET status='past_due', updated_at=NOW() WHERE cashfree_subscription_id=$1`,
          [subId]
        );
      }
    }
  } catch (e: any) {
    logger.error({ err: e, eventType }, 'cashfree webhook handler failed');
  }

  res.json({ ok: true });
});

// SignalHire (and many webhook senders) do a HEAD/GET preflight to verify the
// callback URL is alive before they bother sending the actual POST. Always
// answer 200 for those — silently failing the preflight made SignalHire skip
// every async callback.
router.head('/signalhire', (_req, res) => res.status(200).end());
router.get('/signalhire', (_req, res) => res.json({ ok: true, endpoint: 'signalhire-webhook' }));

router.post('/signalhire', express.json({ limit: '4mb' }), async (req, res) => {
  try {
    const results = Array.isArray(req.body) ? req.body : [req.body];
    logger.info(
      { count: results.length, sample: results[0] ? Object.keys(results[0]) : [] },
      'SignalHire callback received'
    );
    const { handleCallback } = await import('../enrichment/signalHire');
    await handleCallback(results);
    res.json({ ok: true, processed: results.length });
  } catch (err: any) {
    logger.error({ err: err.message }, 'SignalHire webhook handler crashed');
    // Still 200 so SignalHire doesn't retry-storm us
    res.status(200).json({ ok: false, error: err.message });
  }
});

export default router;
