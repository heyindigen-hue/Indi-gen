import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client';
import { validateBody } from '../middleware/validate';
import { getBalance } from '../services/tokens';
import { Cashfree } from '../services/cashfree';

const router = Router();

const topupSchema = z.object({
  bundleId: z.string().min(1),
  tokens: z.number().int().positive(),
  amount: z.number().positive(),
});

const subscribeSchema = z.object({
  planId: z.string().min(1),
});

router.get('/plans', async (_req, res) => {
  const plans = await query(
    `SELECT id, name, description, price_inr, tokens_included, features, enabled
     FROM subscription_plans WHERE enabled=TRUE ORDER BY price_inr ASC`
  );
  res.json(plans);
});

router.get('/tokens/balance', async (req: any, res) => {
  const balance = await getBalance(req.user.id);
  const recent = await query(
    `SELECT id, delta, kind, reason, created_at FROM token_transactions
     WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`,
    [req.user.id]
  );
  res.json({ balance, recent });
});

router.get('/tokens/transactions', async (req: any, res) => {
  const { limit = '50', offset = '0' } = req.query;
  const rows = await query(
    `SELECT id, delta, kind, reason, grant_id, job_id, created_at
     FROM token_transactions WHERE user_id=$1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.user.id, parseInt(limit as string), parseInt(offset as string)]
  );
  res.json(rows);
});

router.post('/checkout/topup', validateBody(topupSchema), async (req: any, res) => {
  const { tokens, amount } = req.body;
  const user = await queryOne<any>(`SELECT id, email, name, phone FROM users WHERE id=$1`, [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const orderId = `topup-${req.user.id}-${Date.now()}`;

  try {
    const orderReq: any = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: req.user.id,
        customer_email: user.email,
        customer_name: user.name || user.email,
        customer_phone: user.phone || '9999999999',
      },
      order_tags: { tokens: String(tokens), type: 'topup' },
    };

    const response = await Cashfree.PGCreateOrder('2023-08-01', orderReq);
    const order = response.data;

    res.status(201).json({ orderId, paymentSessionId: order.payment_session_id, cfOrderId: order.cf_order_id });
  } catch (err: any) {
    res.status(502).json({ error: 'Payment gateway error', detail: err.message });
  }
});

router.post('/checkout/subscribe', validateBody(subscribeSchema), async (req: any, res) => {
  const { planId } = req.body;
  const plan = await queryOne<any>(`SELECT * FROM subscription_plans WHERE id=$1 AND enabled=TRUE`, [planId]);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const user = await queryOne<any>(`SELECT id, email, name, phone FROM users WHERE id=$1`, [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const subReq: any = {
      subscription_id: `sub-${req.user.id}-${Date.now()}`,
      plan_id: plan.cashfree_plan_id || planId,
      customer_details: {
        customer_id: req.user.id,
        customer_email: user.email,
        customer_name: user.name || user.email,
        customer_phone: user.phone || '9999999999',
      },
    };

    const response = await Cashfree.SubsCreateSubscription('2023-08-01', subReq);
    const sub = response.data;

    await query(
      `INSERT INTO subscriptions (user_id, plan_id, cashfree_subscription_id, status, current_period_start)
       VALUES ($1,$2,$3,'pending',NOW())
       ON CONFLICT (cashfree_subscription_id) DO UPDATE SET status='pending', updated_at=NOW()`,
      [req.user.id, planId, sub.subscription_id || subReq.subscription_id]
    );

    res.status(201).json({ subscriptionId: sub.subscription_id, subscriptionSessionId: sub.subscription_session_id });
  } catch (err: any) {
    res.status(502).json({ error: 'Payment gateway error', detail: err.message });
  }
});

router.post('/subscriptions/:id/cancel', async (req: any, res) => {
  const sub = await queryOne<any>(
    `SELECT id FROM subscriptions WHERE id=$1 AND user_id=$2 AND status='active'`,
    [req.params.id, req.user.id]
  );
  if (!sub) return res.status(404).json({ error: 'Active subscription not found' });
  await query(
    `UPDATE subscriptions SET cancel_at_period_end=TRUE, updated_at=NOW() WHERE id=$1`,
    [req.params.id]
  );
  res.json({ ok: true, message: 'Subscription will cancel at period end' });
});

router.get('/invoices', async (req: any, res) => {
  const invoices = await query(
    `SELECT id, total, currency, status, issued_at, due_at, created_at
     FROM invoices WHERE user_id=$1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(invoices);
});

router.get('/invoices/:id', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const invoice = await queryOne<any>(
    `SELECT * FROM invoices WHERE id=$1 ${isAdmin ? '' : 'AND user_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

export default router;
