import { logger } from '../logger';
import { query } from '../db/client';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(expoPushToken: string, payload: PushPayload): Promise<void> {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken') && !expoPushToken.startsWith('ExpoPushToken')) {
    logger.warn({ expoPushToken: expoPushToken?.substring(0, 12) }, 'push: invalid token format, skipping');
    return;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.warn(
        { tokenPrefix: expoPushToken.substring(0, 12), status: response.status, body: text },
        'push: send failed'
      );
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'push: send threw');
  }
}

interface UserToken {
  user_id: string;
  push_token: string;
}

async function loadActiveTokens(userIds?: string[]): Promise<UserToken[]> {
  if (userIds && userIds.length === 0) return [];
  if (userIds && userIds.length > 0) {
    return query<UserToken>(
      `SELECT id AS user_id, push_token FROM users
       WHERE id = ANY($1::uuid[]) AND push_token IS NOT NULL AND deleted_at IS NULL`,
      [userIds]
    );
  }
  return query<UserToken>(
    `SELECT id AS user_id, push_token FROM users
     WHERE push_token IS NOT NULL AND deleted_at IS NULL`
  );
}

interface HotLeadRow {
  id: string;
  owner_id: string | null;
  name: string | null;
  company: string | null;
  score: number | null;
}

/**
 * Hot-lead alert — leads where status='New' AND intent_label='BUYER_PROJECT'
 * AND intent_confidence >= 0.8 AND score >= 8 AND has at least 1 contact AND
 * notified_at IS NULL. Marks notified_at after sending.
 */
export async function dispatchHotLeadAlerts(): Promise<{ alerts: number; users: number }> {
  const hotLeads = await query<HotLeadRow>(
    `SELECT l.id, l.owner_id, l.name, l.company, l.score
     FROM leads l
     WHERE l.status = 'New'
       AND l.intent_label = 'BUYER_PROJECT'
       AND l.intent_confidence >= 0.8
       AND l.score >= 8
       AND l.notified_at IS NULL
       AND EXISTS (SELECT 1 FROM contacts c WHERE c.lead_id = l.id)
     ORDER BY l.created_at DESC
     LIMIT 50`
  );

  if (hotLeads.length === 0) return { alerts: 0, users: 0 };

  // Group leads by owner. Leads without an owner_id are sent to all admins.
  const ownerless = hotLeads.filter((l) => !l.owner_id);
  const byOwner = new Map<string, HotLeadRow[]>();
  for (const l of hotLeads) {
    if (!l.owner_id) continue;
    const arr = byOwner.get(l.owner_id) ?? [];
    arr.push(l);
    byOwner.set(l.owner_id, arr);
  }

  let alertsSent = 0;
  let userCount = 0;

  for (const [ownerId, leads] of byOwner) {
    const tokens = await loadActiveTokens([ownerId]);
    if (!tokens.length) {
      // still mark notified so we don't keep retrying for tokenless users
      await query(`UPDATE leads SET notified_at=NOW() WHERE id = ANY($1::uuid[])`, [leads.map((l) => l.id)]);
      continue;
    }
    userCount += tokens.length;
    for (const lead of leads.slice(0, 5)) {
      const title = '🔥 Hot lead';
      const body = `${lead.name ?? 'Buyer'}${lead.company ? ` at ${lead.company}` : ''} · score ${lead.score ?? 0}/10`;
      for (const t of tokens) {
        await sendPushNotification(t.push_token, {
          title,
          body,
          data: { type: 'hot_lead', leadId: lead.id, route: `/lead/${lead.id}` },
        });
      }
      alertsSent++;
    }
    await query(`UPDATE leads SET notified_at=NOW() WHERE id = ANY($1::uuid[])`, [leads.map((l) => l.id)]);
  }

  if (ownerless.length) {
    const adminTokens = await query<UserToken>(
      `SELECT id AS user_id, push_token FROM users
       WHERE push_token IS NOT NULL AND deleted_at IS NULL
         AND role IN ('admin','super_admin')`
    );
    if (adminTokens.length) {
      userCount += adminTokens.length;
      for (const lead of ownerless.slice(0, 5)) {
        const title = '🔥 Hot lead';
        const body = `${lead.name ?? 'Buyer'}${lead.company ? ` at ${lead.company}` : ''} · score ${lead.score ?? 0}/10`;
        for (const t of adminTokens) {
          await sendPushNotification(t.push_token, {
            title,
            body,
            data: { type: 'hot_lead', leadId: lead.id, route: `/lead/${lead.id}` },
          });
        }
        alertsSent++;
      }
    }
    await query(`UPDATE leads SET notified_at=NOW() WHERE id = ANY($1::uuid[])`, [ownerless.map((l) => l.id)]);
  }

  return { alerts: alertsSent, users: userCount };
}

/**
 * 9 AM IST daily digest — count of new leads in last 24h + count of follow-ups due today.
 * One push per user with a token.
 */
export async function dispatchDailyDigest(): Promise<{ users: number }> {
  const tokens = await loadActiveTokens();
  if (!tokens.length) return { users: 0 };

  let sent = 0;
  for (const t of tokens) {
    const [newRows, followUpRows] = await Promise.all([
      query<{ c: number }>(
        `SELECT COUNT(*)::int AS c FROM leads
         WHERE owner_id = $1::uuid
           AND status NOT IN ('archived','closed')
           AND created_at > NOW() - INTERVAL '24 hours'`,
        [t.user_id]
      ),
      query<{ c: number }>(
        `SELECT COUNT(*)::int AS c FROM leads
         WHERE owner_id = $1::uuid
           AND status = 'Contacted'
           AND last_outreach_at IS NOT NULL
           AND last_outreach_at < NOW() - INTERVAL '3 days'
           AND NOT EXISTS (
             SELECT 1 FROM outreach_log r WHERE r.lead_id = leads.id AND r.status = 'replied'
           )`,
        [t.user_id]
      ),
    ]);

    const newCount = newRows[0]?.c ?? 0;
    const followCount = followUpRows[0]?.c ?? 0;
    if (newCount === 0 && followCount === 0) continue;

    const parts: string[] = [];
    if (newCount > 0) parts.push(`${newCount} new lead${newCount === 1 ? '' : 's'}`);
    if (followCount > 0) parts.push(`${followCount} follow-up${followCount === 1 ? '' : 's'} due`);
    await sendPushNotification(t.push_token, {
      title: 'Your morning brief',
      body: parts.join(' · '),
      data: { type: 'daily_digest', route: '/(tabs)' },
    });
    sent++;
  }
  return { users: sent };
}
