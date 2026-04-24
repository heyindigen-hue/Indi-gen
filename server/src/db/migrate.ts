import fs from 'fs';
import path from 'path';
import { db } from './client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const migrationsDir = path.join(__dirname, '../../../db/migrations');
  const seedFile = path.join(__dirname, '../../../db/seed.sql');

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`Running ${files.length} migrations...`);

  await db.query(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  const applied = await db.query('SELECT name FROM _migrations');
  const appliedSet = new Set(applied.rows.map((r: any) => r.name));

  for (const f of files) {
    if (appliedSet.has(f)) { console.log(`  skip ${f} (applied)`); continue; }
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
    console.log(`  applying ${f}...`);
    await db.query(sql);
    await db.query('INSERT INTO _migrations (name) VALUES ($1)', [f]);
  }

  if (fs.existsSync(seedFile)) {
    console.log('Seeding...');
    const sql = fs.readFileSync(seedFile, 'utf8');
    await db.query(sql);
  }

  const { rows: [count] } = await db.query(`SELECT COUNT(*)::int as c FROM users WHERE role IN ('admin','super_admin')`);
  if (count.c === 0) {
    const hash = await bcrypt.hash('indigen@2026', 10);
    await db.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'super_admin')`,
      ['indigenservices5@gmail.com', hash, 'Indigen Admin']
    );
    console.log('Default admin created: indigenservices5@gmail.com / indigen@2026');
  }

  console.log('Migration + seed complete.');
  await db.end();
}

run().catch(e => { console.error(e); process.exit(1); });
