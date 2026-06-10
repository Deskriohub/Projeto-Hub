/**
 * Soma N meses a uma data "YYYY-MM-DD", tratando fim de mês.
 * Ex: 31/01 + 1 mês => 28/02 (ou 29 em ano bissexto).
 */
export function addMonthsStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1 + n, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const day = Math.min(d, daysInTarget);
  const dt = new Date(target.getFullYear(), target.getMonth(), day);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/**
 * Gera uma lista de datas mensais a partir de uma data inicial (inclusive).
 * total = quantas ocorrências no total (1 = só a data inicial).
 */
export function gerarDatasMensais(dataInicial: string, total: number): string[] {
  const datas: string[] = [];
  for (let i = 0; i < Math.max(1, total); i++) {
    datas.push(addMonthsStr(dataInicial, i));
  }
  return datas;
}
