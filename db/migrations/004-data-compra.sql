-- Data real da compra no cartão (a coluna `month` guarda o mês da fatura).
-- Seguro rodar mais de uma vez.
alter table transactions add column if not exists data_compra date;
