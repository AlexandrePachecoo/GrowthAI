import { pool } from './db';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rows } = await pool.query('SELECT id FROM migrations WHERE filename = $1', [file]);
    if (rows.length > 0) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
    console.log(`Migration applied: ${file}`);
  }
}
