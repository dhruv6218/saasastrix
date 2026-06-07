import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from '../db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  console.log('[Migrate] Running schema migration...');
  try {
    const schema = readFileSync(join(__dirname, '../schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('[Migrate] ✅ Schema applied successfully');
  } catch (err) {
    console.error('[Migrate] ❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
