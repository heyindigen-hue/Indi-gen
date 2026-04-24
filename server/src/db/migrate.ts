import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const migrationsDir = path.resolve(__dirname, '../../../db/migrations');

async function migrate() {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }
  await pool.end();
  console.log('Migrations complete');
}

migrate().catch(err => { console.error(err); process.exit(1); });
