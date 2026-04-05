// Helpers de data/hora no fuso horário de Brasília
const TZ = 'America/Sao_Paulo';

export function nowBrasilia(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

export function formatDateBrasilia(date: Date, format: string): string {
  if (format === 'YYYYMMDD') {
    const d = new Date(date.toLocaleString('en-US', { timeZone: TZ }));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
  if (format === 'YYYY-MM-DD') {
    const d = new Date(date.toLocaleString('en-US', { timeZone: TZ }));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return date.toISOString();
}

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
