import {
  FinancialTransaction,
  DerivedStatus,
  FinancialSummary,
} from '../types/financial.types';

/**
 * Returns start of today in local time as timestamp in ms.
 */
export function getStartOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Derives visual status (including 'overdue') without mutating database record.
 */
export function getDerivedStatus(transaction: FinancialTransaction): DerivedStatus {
  if (transaction.status === 'paid') return 'paid';
  if (transaction.status === 'canceled') return 'canceled';

  const todayStart = getStartOfTodayMs();
  if (transaction.dueDate < todayStart) {
    return 'overdue';
  }
  return 'pending';
}

/**
 * Formats a number to Brazilian Real currency string (R$ 1.234,56).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount || 0);
}

/**
 * Formats timestamp ms to DD/MM/YYYY local date string.
 */
export function formatDateMs(ms: number | null | undefined): string {
  if (!ms) return '-';
  const d = new Date(ms);
  // Add timezone offset correction to prevent date shift if timestamp was midnight UTC/local
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC', // We store UTC start-of-day timestamps
  });
}

/**
 * Converts a YYYY-MM-DD string from HTML date input to start-of-day UTC timestamp ms.
 */
export function isoToTimestamp(isoDateStr: string): number {
  if (!isoDateStr) return Date.now();
  const [year, month, day] = isoDateStr.split('-').map(Number);
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Converts a timestamp ms to YYYY-MM-DD string for HTML date input.
 */
export function timestampToIso(ms: number): string {
  if (!ms) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates metrics for financial summary cards.
 */
export function calculateFinancialSummary(
  transactions: FinancialTransaction[]
): FinancialSummary {
  const todayStart = getStartOfTodayMs();
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();

  let toReceive = 0;
  let receivedMonth = 0;
  let overdue = 0;

  for (const t of transactions) {
    if (t.type !== 'income') continue;

    const derived = getDerivedStatus(t);

    if (derived === 'pending') {
      toReceive += t.amount || 0;
    } else if (derived === 'overdue') {
      overdue += t.amount || 0;
    } else if (derived === 'paid' && t.paymentDate) {
      const pDate = new Date(t.paymentDate);
      if (pDate.getUTCMonth() === currentMonth && pDate.getUTCFullYear() === currentYear) {
        receivedMonth += t.amount || 0;
      }
    }
  }

  return {
    toReceive,
    receivedMonth,
    overdue,
    totalExpected: toReceive + overdue,
  };
}

/**
 * Category options for financial transactions
 */
export const FINANCIAL_CATEGORIES = [
  'Instalação Elétrica',
  'Manutenção Preventiva / Corretiva',
  'Automação Residencial / Predial',
  'Quadro de Distribuição / Padrão',
  'Laudo Técnico / Vistoria',
  'Projetos & Consultoria',
  'Venda de Materiais',
  'Outros Serviços',
];

/**
 * Status labels and color badge styling
 */
export const STATUS_CONFIG: Record<
  DerivedStatus,
  { label: string; badgeClass: string; borderClass: string }
> = {
  pending: {
    label: 'PENDENTE',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    borderClass: 'border-l-amber-500',
  },
  paid: {
    label: 'PAGO',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    borderClass: 'border-l-emerald-500',
  },
  overdue: {
    label: 'VENCIDA',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    borderClass: 'border-l-rose-500',
  },
  canceled: {
    label: 'CANCELADA',
    badgeClass: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
    borderClass: 'border-l-slate-400',
  },
};
