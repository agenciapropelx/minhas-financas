-- Minhas Finanças — schema para Postgres (Supabase). Aplicar com scripts/apply-schema.mjs ou no SQL Editor.

create table users (
  id uuid primary key default gen_random_uuid(),
  login text not null unique,
  created_at timestamptz not null default now()
);

create table months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  month text not null,
  meta numeric not null default 0,
  nota text,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  month text not null,
  type text not null check (type in ('entrada', 'fixo', 'variavel')),
  descricao text not null,
  valor numeric not null check (valor > 0),
  categoria text,
  dia_vencimento int check (dia_vencimento between 1 and 31),
  pago boolean not null default false,
  cartao boolean not null default false,   -- pago no cartão de crédito
  parcela int,                             -- compras parceladas: parcela atual
  parcelas int,                            -- compras parceladas: total
  grupo uuid,                              -- compras parceladas: id comum às parcelas
  data_compra date,                        -- compras no cartão: data real da compra
  created_at timestamptz not null default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nome text not null,
  dia_fechamento int not null check (dia_fechamento between 1 and 28),
  dia_vencimento int not null check (dia_vencimento between 1 and 28),
  limite numeric
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  month text not null,
  categoria text not null,
  limite numeric not null check (limite >= 0),
  unique (user_id, month, categoria)
);

-- gastos enviados pelo Telegram aguardando escolha de categoria (botões)
create table telegram_pending (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null,
  tipo text not null check (tipo in ('gasto', 'entrada')),
  descricao text not null,
  valor numeric not null check (valor > 0),
  dia int not null,
  month text not null,
  cartao boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_transactions_user_month on transactions (user_id, month);
create index idx_budgets_user_month on budgets (user_id, month);
create index idx_transactions_grupo on transactions (grupo);

-- Supabase: bloqueia a API pública (ver db/migrations/003-supabase-rls.sql).
alter table users enable row level security;
alter table months enable row level security;
alter table transactions enable row level security;
alter table cards enable row level security;
alter table budgets enable row level security;
alter table telegram_pending enable row level security;
