// Aplica db/schema.sql (ou o arquivo .sql informado) no banco apontado por DATABASE_URL.
// Uso: node scripts/apply-schema.mjs [db/migrations/xxx.sql]  (lê DATABASE_URL do ambiente)
import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL não definida'); process.exit(1); }
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });

const schemaPath = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'schema.sql');
const schema = readFileSync(schemaPath, 'utf8');
// remove comentários e divide em statements (schema simples, sem funções/plpgsql)
const statements = schema
  .split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
  .split(';').map(s => s.trim()).filter(Boolean);

try {
  for (const st of statements) {
    await sql.unsafe(st);
    console.log('ok:', st.slice(0, 60).replace(/\s+/g, ' '));
  }
  const tables = await sql.unsafe(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  console.log('\nTabelas no banco:', tables.map(t => t.table_name).join(', '));
} finally {
  await sql.end();
}
