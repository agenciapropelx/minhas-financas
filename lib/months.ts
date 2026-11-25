export function todayKey(d: Date = new Date()): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export function shiftMonth(key: string, delta: number): string {
  let [y, m] = key.split('-').map(Number);
  m += delta;
  while (m < 1) { m += 12; y--; }
  while (m > 12) { m -= 12; y++; }
  return y + '-' + String(m).padStart(2, '0');
}

export function diasNoMes(key: string): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthName(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shortMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

/** '2026-12-10' → { month: '2026-12', dia: 10 }; null se a data for inválida/vazia. */
export function dataParaMesDia(iso: string): { month: string; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  return { month: `${y}-${mo}`, dia: Number(d) };
}

/** { month: '2026-12', dia: 10 } → '2026-12-10' (valor do <input type="date">). */
export function mesDiaParaData(month: string, dia: number | null): string {
  if (!dia) return '';
  return `${month}-${String(dia).padStart(2, '0')}`;
}
