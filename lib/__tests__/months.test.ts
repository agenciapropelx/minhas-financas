import { describe, expect, it } from 'vitest';
import { dataParaMesDia, hojeISO, mesDiaParaData, rotuloData, monthName, shiftMonth, shortMonth, todayKey } from '@/lib/months';

describe('shiftMonth', () => {
  it('avança dentro do ano', () => expect(shiftMonth('2026-07', 1)).toBe('2026-08'));
  it('vira o ano para frente', () => expect(shiftMonth('2026-12', 1)).toBe('2027-01'));
  it('vira o ano para trás', () => expect(shiftMonth('2026-01', -1)).toBe('2025-12'));
  it('aceita deltas grandes', () => expect(shiftMonth('2026-07', 18)).toBe('2028-01'));
});

describe('todayKey', () => {
  it('formata a data como YYYY-MM', () => {
    expect(todayKey(new Date(2026, 6, 9))).toBe('2026-07');
  });
});

describe('nomes', () => {
  it('nome completo capitalizado', () => {
    expect(monthName('2026-07').toLowerCase()).toContain('julho');
    expect(monthName('2026-07')).toContain('2026');
  });
  it('nome curto sem ponto', () => {
    expect(shortMonth('2026-07').toLowerCase().startsWith('jul')).toBe(true);
    expect(shortMonth('2026-07')).not.toContain('.');
  });
});

describe('vencimento (data ↔ mês/dia)', () => {
  it('extrai mês e dia da data', () => expect(dataParaMesDia('2026-12-10')).toEqual({ month: '2026-12', dia: 10 }));
  it('data vazia ou inválida → null', () => {
    expect(dataParaMesDia('')).toBeNull();
    expect(dataParaMesDia('10/12/2026')).toBeNull();
  });
  it('reconstrói a data para o input', () => expect(mesDiaParaData('2026-12', 5)).toBe('2026-12-05'));
  it('sem dia → vazio', () => expect(mesDiaParaData('2026-12', null)).toBe(''));
});

describe('hojeISO / rotuloData', () => {
  it('formata a data local', () => expect(hojeISO(new Date(2026, 11, 5))).toBe('2026-12-05'));
  const base = { month: '2026-12', dia_vencimento: 10, cartao: false, data_compra: null };
  it('despesa comum: dd/mm do mês', () => expect(rotuloData(base)).toBe('10/12'));
  it('cartão com data real', () => expect(rotuloData({ ...base, cartao: true, data_compra: '2026-11-28' })).toBe('28/11'));
  it('cartão sem data real: dia', () => expect(rotuloData({ ...base, cartao: true })).toBe('dia 10'));
  it('sem dia', () => expect(rotuloData({ ...base, dia_vencimento: null })).toBe('—'));
});
