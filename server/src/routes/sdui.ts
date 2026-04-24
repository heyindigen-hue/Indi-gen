import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client';
import { validateBody } from '../middleware/validate';

const router = Router();

// Public
router.get('/ui-manifest', async (req, res) => {
  const { platform = 'mobile', user_id } = req.query;

  const manifests = await query(
    `SELECT * FROM ui_manifests WHERE enabled=TRUE AND (platform=$1 OR platform='all') ORDER BY published_at DESC LIMIT 1`,
    [platform]
  );

  if (!manifests.length) return res.status(404).json({ error: 'No manifest found' });
  const manifest = manifests[0];

  let experiments: any[] = [];
  if (user_id) {
    experiments = await query(
      `SELECT e.key, ea.variant FROM experiment_assignments ea
       JOIN experiments e ON e.id=ea.experiment_id
       WHERE ea.user_id=$1 AND e.is_active=TRUE`,
      [user_id]
    );
  }

  res.json({
    ...manifest.manifest,
    _meta: {
      manifestId: manifest.id,
      version: manifest.version,
      platform,
      experiments: Object.fromEntries(experiments.map(e => [e.key, e.variant])),
    },
  });
});

router.get('/brand', async (req, res) => {
  const { platform = 'mobile' } = req.query;
  const manifests = await query(
    `SELECT manifest->'brand' AS brand FROM ui_manifests WHERE enabled=TRUE AND (platform=$1 OR platform='all') ORDER BY published_at DESC LIMIT 1`,
    [platform]
  );
  if (!manifests.length) return res.status(404).json({ error: 'No manifest found' });
  res.json(manifests[0].brand || {});
});

// Admin
router.get('/manifests', async (_req, res) => {
  const rows = await query(`SELECT * FROM ui_manifests ORDER BY created_at DESC`);
  res.json(rows);
});

const manifestSchema = z.object({
  name: z.string().min(1),
  platform: z.enum(['mobile', 'web', 'all']).default('mobile'),
  version: z.string().min(1),
  content: z.record(z.any()),
});

router.post('/manifests', validateBody(manifestSchema), async (req: any, res) => {
  const { name, platform, version, content } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO ui_manifests (name, platform, version, manifest, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, platform, version, JSON.stringify(content), req.user?.id || null]
  );
  res.status(201).json(row);
});

router.patch('/manifests/:id', async (req: any, res) => {
  const { name, content, version } = req.body;
  const updates: string[] = [];
  const params: any[] = [];
  if (name !== undefined) { params.push(name); updates.push(`name=$${params.length}`); }
  if (version !== undefined) { params.push(version); updates.push(`version=$${params.length}`); }
  if (content !== undefined) { params.push(JSON.stringify(content)); updates.push(`manifest=$${params.length}`); }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  const row = await queryOne<any>(
    `UPDATE ui_manifests SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`,
    params
  );
  if (!row) return res.status(404).json({ error: 'Manifest not found' });
  res.json(row);
});

router.post('/manifests/:id/publish', async (req: any, res) => {
  await query(`UPDATE ui_manifests SET enabled=FALSE WHERE platform=(SELECT platform FROM ui_manifests WHERE id=$1)`, [req.params.id]);
  const row = await queryOne<any>(
    `UPDATE ui_manifests SET enabled=TRUE, published_at=NOW(), published_by=$1 WHERE id=$2 RETURNING *`,
    [req.user?.id || null, req.params.id]
  );
  if (!row) return res.status(404).json({ error: 'Manifest not found' });
  res.json(row);
});

router.post('/manifests/:id/rollback', async (req: any, res) => {
  const current = await queryOne<any>(`SELECT platform FROM ui_manifests WHERE id=$1 AND enabled=TRUE`, [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Active manifest not found' });

  const previous = await queryOne<any>(
    `SELECT id FROM ui_manifests WHERE platform=$1 AND id!=$2 AND published_at IS NOT NULL ORDER BY published_at DESC LIMIT 1`,
    [current.platform, req.params.id]
  );
  if (!previous) return res.status(400).json({ error: 'No previous manifest to roll back to' });

  await query(`UPDATE ui_manifests SET enabled=FALSE WHERE id=$1`, [req.params.id]);
  await query(`UPDATE ui_manifests SET enabled=TRUE, published_at=NOW() WHERE id=$1`, [previous.id]);
  res.json({ ok: true, rolledBackTo: previous.id });
});

// Experiments
router.get('/experiments', async (_req, res) => {
  const rows = await query(`SELECT * FROM experiments ORDER BY created_at DESC`);
  res.json(rows);
});

const experimentSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  variants: z.array(z.object({ key: z.string(), weight: z.number() })),
});

router.post('/experiments', validateBody(experimentSchema), async (req: any, res) => {
  const { key, name, description, variants } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO experiments (key, name, description, variants, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [key, name, description || null, JSON.stringify(variants), req.user?.id || null]
  );
  res.status(201).json(row);
});

router.patch('/experiments/:id', async (req: any, res) => {
  const { name, description, variants, is_active } = req.body;
  const updates: string[] = [];
  const params: any[] = [];
  if (name !== undefined) { params.push(name); updates.push(`name=$${params.length}`); }
  if (description !== undefined) { params.push(description); updates.push(`description=$${params.length}`); }
  if (variants !== undefined) { params.push(JSON.stringify(variants)); updates.push(`variants=$${params.length}`); }
  if (is_active !== undefined) { params.push(is_active); updates.push(`is_active=$${params.length}`); }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  const row = await queryOne<any>(
    `UPDATE experiments SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`,
    params
  );
  if (!row) return res.status(404).json({ error: 'Experiment not found' });
  res.json(row);
});

router.delete('/experiments/:id', async (_req, res) => {
  await query(`DELETE FROM experiments WHERE id=$1`, [_req.params.id]);
  res.json({ ok: true });
});

export default router;
