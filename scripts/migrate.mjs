// Aplica as migrações db/migrations/004+ (idempotentes) antes do build.
// Sem DATABASE_URL (ex.: build local) apenas avisa e segue. Falha no banco derruba o build,
// mantendo no ar a versão anterior.
import postgres from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.env.DATABASE_URL;
if (!url) { console.warn('migrate: DATABASE_URL ausente — migrações ignoradas'); process.exit(0); }
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
const arquivos = readdirSync(dir).filter(f => /^\d+-.*\.sql$/.test(f) && parseInt(f, 10) >= 4).sort();
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });
try {
  for (const f of arquivos) {
    const stmts = readFileSync(join(dir, f), 'utf8')
      .split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
      .split(';').map(s => s.trim()).filter(Boolean);
    for (const st of stmts) await sql.unsafe(st);
    console.log('migrate: ok', f);
  }
} finally {
  await sql.end();
}
