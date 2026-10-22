/** Regras puras dos horários: independentes de Vercel e Firebase, testáveis localmente. */
export interface ReminderEvent {
  date: number;
  recurrence?: string;
  notifyTime?: string;
}

export interface DueReminder {
  occurrenceAt: number;
  plannedAt: number;
  label: string;
}

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const LEAD: Record<string, number> = {
  at_event: 0,
  '5_min': 5,
  '15_min': 15,
  '1_hour': 60,
  '24_hours': 1440,
};

const LABEL: Record<string, string> = {
  at_event: 'está agendado para agora!',
  '5_min': 'começa em aproximadamente 5 minutos.',
  '15_min': 'começa em aproximadamente 15 minutos.',
  '1_hour': 'começa em aproximadamente 1 hora.',
  '24_hours': 'está agendado para amanhã.',
};

function addMonthsClampedUtc(base: number, months: number): number {
  const d = new Date(base);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + months;
  const first = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(lastDay, d.getUTCDate()));
  first.setUTCHours(d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
  return first.getTime();
}

/** Seleciona ocorrência próxima ao disparo, inclusive ciclos antigos. */
export function getDueReminder(event: ReminderEvent, now: number): DueReminder | null {
  const base = Number(event.date);
  const notifyTime = event.notifyTime || 'none';
  if (!Number.isFinite(base) || base <= 0 || !(notifyTime in LEAD)) return null;

  const lead = LEAD[notifyTime] * MIN;
  const target = now + lead;
  const mode = event.recurrence || 'none';
  const candidates: number[] = [];

  if (mode === 'none') {
    candidates.push(base);
  } else if (mode === 'daily' || mode === 'weekly') {
    const period = mode === 'daily' ? DAY : 7 * DAY;
    const n = Math.max(0, Math.floor((target - base) / period));
    for (const i of [n - 1, n, n + 1]) if (i >= 0) candidates.push(base + i * period);
  } else if (mode === 'monthly') {
    const t = new Date(target);
    const b = new Date(base);
    const n = Math.max(0, (t.getUTCFullYear() - b.getUTCFullYear()) * 12 + t.getUTCMonth() - b.getUTCMonth());
    for (const i of [n - 1, n, n + 1]) if (i >= 0) candidates.push(addMonthsClampedUtc(base, i));
  } else {
    return null;
  }

  for (const occurrenceAt of candidates) {
    if (occurrenceAt < base) continue;
    const plannedAt = occurrenceAt - lead;
    // Até um minuto adiantado por diferenças entre relógios dos servidores.
    const earliest = plannedAt - MIN;
    // Recupera atrasos; avisos antecipados NÃO são enviados após o compromisso começar.
    const latest = lead > 0 ? Math.min(occurrenceAt, plannedAt + 10 * MIN) : plannedAt + 10 * MIN;
    if (now >= earliest && now <= latest) {
      return { occurrenceAt, plannedAt, label: LABEL[notifyTime] };
    }
  }
  return null;
}
