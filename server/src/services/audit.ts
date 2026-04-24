import { query } from '../db/client';

export async function audit(params: {
  actorId?: string; actorType?: string; action: string;
  targetType?: string; targetId?: string;
  before?: any; after?: any; ip?: string; userAgent?: string;
}) {
  await query(
    `INSERT INTO audit_log (actor_id, actor_type, action, target_type, target_id, before_state, after_state, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [params.actorId || null, params.actorType || 'user', params.action,
     params.targetType || null, params.targetId || null,
     params.before ? JSON.stringify(params.before) : null,
     params.after ? JSON.stringify(params.after) : null,
     params.ip || null, params.userAgent || null]
  );
}
