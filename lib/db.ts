import postgres from 'postgres';

// Postgres via Supabase (pooler em modo transação, porta 6543).
// - prepare: false → o pooler em modo transação não suporta prepared statements.
// - max: 1 → cada instância serverless usa 1 conexão; o pooler multiplexa.
// - undefined → null, para colunas opcionais não derrubarem o insert.
// O singleton em globalThis evita abrir conexões novas a cada hot reload no dev.
const globalForDb = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida');
  return postgres(url, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    transform: { undefined: null },
  });
}

export const sql = (globalForDb.__sql ??= connect());
