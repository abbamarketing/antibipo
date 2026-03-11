// Brasília timezone utilities
const BRASILIA_TZ = "America/Sao_Paulo";

export function brasiliaTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BRASILIA_TZ }));
}

export function brasiliaTimeString(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    timeZone: BRASILIA_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function brasiliaDateString(): string {
  return new Date().toLocaleDateString("pt-BR", {
    timeZone: BRASILIA_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function brasiliaISO(): string {
  return new Date().toLocaleString("sv-SE", { timeZone: BRASILIA_TZ }).split(" ")[0];
}
