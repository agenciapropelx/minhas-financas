-- Supabase expõe o schema public via API REST (PostgREST). Sem RLS, quem tiver
-- a chave pública (anon) do projeto conseguiria ler/escrever estas tabelas.
-- Com RLS ligado e nenhuma policy, a API pública fica sem acesso; o app não é
-- afetado porque conecta direto como `postgres` (BYPASSRLS) e já escopa por user_id.
-- Seguro rodar mais de uma vez.
alter table users enable row level security;
alter table months enable row level security;
alter table transactions enable row level security;
alter table cards enable row level security;
alter table budgets enable row level security;
alter table telegram_pending enable row level security;
