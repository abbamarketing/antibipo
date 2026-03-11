// Currency formatting utilities for financial module

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}${Math.round(abs)}`;
}

export function parseCurrencyInput(input: string): number {
  const cleaned = input.replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export function isValidDay(ano: number, mes: number, dia: number): boolean {
  const date = new Date(ano, mes - 1, dia);
  return date.getFullYear() === ano && date.getMonth() === mes - 1 && date.getDate() === dia;
}

export function daysInMonth(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

export function mesAbreviado(mes: number): string {
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return nomes[mes - 1] || "";
}

export function saldoColor(saldo: number): string {
  if (saldo < -1000) return "#ef4444";
  if (saldo < 0) return "#fca5a5";
  if (saldo >= -200 && saldo <= 200) return "#fef3c7";
  if (saldo > 0 && saldo <= 1500) return "#bbf7d0";
  if (saldo > 1500 && saldo <= 3000) return "#4ade80";
  if (saldo > 3000) return "#16a34a";
  return "#fef3c7";
}

export function saldoTextColor(saldo: number): string {
  if (saldo < -1000) return "#ffffff";
  if (saldo > 3000) return "#ffffff";
  return "#1a1a1a";
}
