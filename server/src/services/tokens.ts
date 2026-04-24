import { query, transaction } from '../db/client';

export async function getBalance(userId: string): Promise<number> {
  const rows = await query(`SELECT COALESCE(SUM(delta),0)::bigint AS balance FROM token_transactions WHERE user_id=$1`, [userId]);
  return parseInt(rows[0]?.balance || '0');
}

export async function grantTokens(params: {
  userId: string; amount: number; source: string; sourceRef?: string;
  expiresAt?: Date; idempotencyKey?: string;
}): Promise<string> {
  return transaction(async (c) => {
    const key = params.idempotencyKey;
    if (key) {
      const dup = await c.query('SELECT id FROM token_grants WHERE idempotency_key=$1', [key]);
      if (dup.rows.length) return dup.rows[0].id;
    }
    const g = await c.query(
      `INSERT INTO token_grants (user_id, amount, source, source_ref, expires_at, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [params.userId, params.amount, params.source, params.sourceRef || null, params.expiresAt || null, key || null]
    );
    const grantId = g.rows[0].id;
    await c.query(
      `INSERT INTO token_transactions (user_id, delta, kind, grant_id, idempotency_key)
       VALUES ($1,$2,'grant',$3,$4)`,
      [params.userId, params.amount, grantId, key ? `${key}:grant` : null]
    );
    return grantId;
  });
}

export async function consumeTokens(params: {
  userId: string; amount: number; reason: string; jobId?: string; idempotencyKey?: string;
}): Promise<boolean> {
  return transaction(async (c) => {
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`tokens:${params.userId}`]);
    const bal = await c.query(`SELECT COALESCE(SUM(delta),0)::bigint AS b FROM token_transactions WHERE user_id=$1`, [params.userId]);
    if (parseInt(bal.rows[0].b) < params.amount) return false;
    await c.query(
      `INSERT INTO token_transactions (user_id, delta, kind, job_id, reason, idempotency_key)
       VALUES ($1, -$2, 'consume', $3, $4, $5)`,
      [params.userId, params.amount, params.jobId || null, params.reason, params.idempotencyKey || null]
    );
    return true;
  });
}

export async function refundTokens(params: {
  userId: string; amount: number; reason: string; idempotencyKey?: string;
}): Promise<void> {
  await query(
    `INSERT INTO token_transactions (user_id, delta, kind, reason, idempotency_key)
     VALUES ($1, $2, 'refund', $3, $4)`,
    [params.userId, params.amount, params.reason, params.idempotencyKey || null]
  );
}
