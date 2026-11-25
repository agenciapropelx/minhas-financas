'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteTransaction, insertCompraCartao, insertTransaction, setTransactionPago, updateTransaction } from '@/lib/actions';
import { CATEGORIAS, CATEGORIAS_ENTRADA } from '@/lib/categories';
import { fmtBRL, parseValorBR } from '@/lib/money';
import { dataParaMesDia, hojeISO, mesDiaParaData, monthName, rotuloData } from '@/lib/months';
import { Transaction, TxType } from '@/lib/types';
import { useMonth, useToast } from './Providers';

export default function TxSection({ title, type, txs, color, categoriaPadrao }: {
  title: string; type: TxType; txs: Transaction[]; color: 'green' | 'red';
  /** categoria já selecionada no formulário (ex.: quando a lista está filtrada) */
  categoriaPadrao?: string | null;
}) {
  const isEntrada = type === 'entrada';
  const categorias: readonly string[] = isEntrada ? CATEGORIAS_ENTRADA : CATEGORIAS;
  const catInicial = categoriaPadrao && categorias.includes(categoriaPadrao) ? categoriaPadrao : categorias[0];
  const { month } = useMonth();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [desc, setDesc] = useState('');
  const [valor, setValor] = useState('');
  const [cat, setCat] = useState<string>(catInicial);
  const [dia, setDia] = useState(hojeISO); // sempre começa em hoje; dá para mudar para frente ou para trás
  const [cartao, setCartao] = useState(false);
  const [parcelas, setParcelas] = useState('1');
  const editandoCartao = !!editing?.cartao;

  const total = txs.reduce((s, t) => s + Number(t.valor), 0);

  function startEdit(t: Transaction) {
    setEditing(t);
    setDesc(t.descricao);
    setValor(Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setCat(t.categoria ?? catInicial);
    setDia(t.data_compra ?? mesDiaParaData(t.month, t.dia_vencimento));
    setCartao(t.cartao);
    setParcelas('1');
  }

  function reset() {
    setEditing(null); setDesc(''); setValor(''); setCat(catInicial); setDia(hojeISO()); setCartao(false); setParcelas('1');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseValorBR(valor);
    if (!desc.trim()) { toast('Digite uma descrição'); return; }
    if (isNaN(v) || v <= 0) { toast('Valor inválido — use por ex. 150,00'); return; }
    // a data define o mês do lançamento (sem data: mês aberto na tela)
    const venc = dataParaMesDia(dia);
    const n = Number(parcelas);
    if (!editing && !isEntrada && cartao && type === 'variavel' && (!n || n < 1 || n > 48)) { toast('Número de parcelas inválido'); return; }
    try {
      if (!editing && !isEntrada && cartao) {
        // compra no cartão: o fechamento define a fatura e as parcelas entram mês a mês
        const msg = await insertCompraCartao({
          descricao: desc.trim(), valorTotal: v, parcelas: type === 'variavel' ? n : 1, categoria: cat,
          type: type === 'fixo' ? 'fixo' : 'variavel', dataCompra: venc ? dia : null, mesBase: venc?.month ?? month,
        });
        reset();
        qc.invalidateQueries();
        toast(msg);
        return;
      }
      const row = {
        // cartão em edição mantém a fatura e a data da compra; o resto segue a data escolhida
        month: editandoCartao && cartao ? editing!.month : venc?.month ?? month,
        type, descricao: desc.trim(), valor: v, categoria: cat,
        dia_vencimento: editandoCartao && cartao ? editing!.dia_vencimento : venc?.dia ?? null,
        cartao: !isEntrada && cartao,
      };
      if (editing) await updateTransaction(editing.id, row);
      else await insertTransaction(row);
      reset();
      qc.invalidateQueries();
      const noutroMes = row.month !== month ? ` em ${monthName(row.month).toLowerCase()}` : '';
      toast((editing ? 'Lançamento atualizado' : 'Lançamento adicionado') + noutroMes);
    } catch {
      toast('Erro ao salvar — tente novamente');
    }
  }

  async function toggle(t: Transaction) {
    await setTransactionPago(t.id, !t.pago);
    qc.invalidateQueries();
  }

  async function remove(t: Transaction) {
    const aviso = t.grupo
      ? `Excluir a parcela ${t.parcela}/${t.parcelas} de "${t.descricao}"? As outras parcelas continuam (para excluir todas, use a aba Cartão).`
      : `Excluir "${t.descricao}"?`;
    if (!confirm(aviso)) return;
    await deleteTransaction(t.id);
    if (editing?.id === t.id) reset();
    qc.invalidateQueries();
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>{title}</h2>
        <span className="total" style={{ color: `var(--${color})` }}>{fmtBRL(total)}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th className="hide-mobile">{isEntrada ? 'Origem' : 'Categoria'}</th>
              <th className="center hide-mobile">{isEntrada ? 'Data' : 'Vencimento'}</th>
              <th className="num">Valor</th>
              <th className="center">Status</th>
              <th className="center" style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {txs.length === 0 && <tr><td colSpan={6} className="empty-row">Nenhum lançamento ainda.</td></tr>}
            {txs.map(t => (
              <tr key={t.id} className={t.pago ? 'paid' : ''}>
                <td>
                  {t.descricao}
                  {t.parcelas && t.parcelas > 1 && <span className="parcela-tag">{t.parcela}/{t.parcelas}</span>}
                </td>
                <td className="hide-mobile">
                  <span className="badge">{t.categoria || (isEntrada ? '—' : 'Outros')}</span>
                  {t.cartao && <span className="badge cartao" title="Pago no cartão de crédito">💳 Cartão</span>}
                </td>
                <td className="center hide-mobile">{rotuloData(t)}</td>
                <td className="num">{fmtBRL(Number(t.valor))}</td>
                <td className="center">
                  <button className={`status-btn ${t.pago ? 'pago' : 'pendente'}`} onClick={() => toggle(t)}>
                    {t.pago ? (isEntrada ? 'Recebido' : 'Pago') : (isEntrada ? 'A receber' : 'Pendente')}
                  </button>
                </td>
                <td className="center" style={{ whiteSpace: 'nowrap' }}>
                  <button className="icon-btn" title="Editar" onClick={() => startEdit(t)}>✎</button>
                  <button className="icon-btn danger" title="Excluir" onClick={() => remove(t)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="add-form" onSubmit={submit}>
        <input className="f-desc" placeholder={isEntrada ? 'Descrição (ex.: salário, freela...)' : 'Descrição (ex.: aluguel, mercado...)'} value={desc} onChange={e => setDesc(e.target.value)} autoComplete="off" />
        <select className="f-cat" value={cat} onChange={e => setCat(e.target.value)} aria-label={isEntrada ? 'Origem' : 'Categoria'}>
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="f-dia" type="date" value={dia} onChange={e => setDia(e.target.value)} disabled={editandoCartao && cartao}
          aria-label={isEntrada ? 'Data do recebimento' : cartao ? 'Data da compra' : 'Data de vencimento'}
          title={editandoCartao && cartao
            ? 'A data da compra no cartão não muda — exclua e lance de novo para alterar'
            : isEntrada ? 'Data do recebimento — o lançamento entra no mês desta data'
              : cartao ? 'Data da compra — o fechamento do cartão define a fatura'
                : 'Data de vencimento — o lançamento entra no mês desta data'} />
        <input className="f-val" placeholder="Valor (R$)" value={valor} onChange={e => setValor(e.target.value)} autoComplete="off" />
        {!isEntrada && (
          <label className="f-check" title="Pago no cartão de crédito">
            <input type="checkbox" checked={cartao} disabled={!!editing} onChange={e => setCartao(e.target.checked)} /> 💳 Cartão
          </label>
        )}
        {!isEntrada && cartao && type === 'variavel' && !editing && (
          <input className="f-dia" type="number" min={1} max={48} placeholder="Parcelas" title="Número de parcelas (cada uma entra numa fatura)"
            aria-label="Número de parcelas" value={parcelas} onChange={e => setParcelas(e.target.value)} />
        )}
        <button type="submit">{editing ? 'Salvar' : 'Adicionar'}</button>
        {editing && <button type="button" className="btn-ghost" onClick={reset}>Cancelar</button>}
      </form>
    </div>
  );
}
