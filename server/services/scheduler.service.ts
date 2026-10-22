import { createHash } from 'node:crypto';
import type { DocumentReference } from 'firebase-admin/firestore';
import { getServerDb } from './adminFirebase.js';
import { ensureAuthenticated, notificationService } from './notification.service.js';
import { getDueReminder } from './reminderSchedule.js';

let intervalId: NodeJS.Timeout | null = null;
let processing = false;

export interface AutomationSummary {
  agendaNotified: number;
  leadsNotified: number;
  quotesNotified: number;
  financialOverdueNotified: number;
}

function scopedUid(): string | null {
  if (process.env.VERCEL_ENV !== 'preview') return null;
  const uid = process.env.PREVIEW_PUSH_TEST_UID;
  if (!uid || uid.length > 128) throw new Error('PREVIEW_PUSH_TEST_UID_MISSING');
  return uid;
}

async function acquireLock(uid: string, type: string, origin: string) {
  const id = createHash('sha256').update(`${uid}:${type}:${origin}`).digest('hex');
  const ref = getServerDb().collection('notification_events').doc(id);
  try {
    const acquired = await getServerDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : undefined;
      if (data?.status === 'sent') return false;
      if (data?.status === 'processing' && Date.now() - Number(data.reservedAt || 0) < 5 * 60_000) return false;
      tx.set(ref, { userId: uid, type, originId: origin, status: 'processing', reservedAt: Date.now() }, { merge: true });
      return true;
    });
    return { acquired, ref };
  } catch (error) {
    console.error('[Push] Falha ao reservar envio:', error);
    return { acquired: false, ref };
  }
}

async function completeLock(ref: DocumentReference, success: boolean) {
  try {
    await ref.set({ status: success ? 'sent' : 'failed', ...(success ? { sentAt: Date.now() } : { failedAt: Date.now() }) }, { merge: true });
  } catch (err) {
    console.error('[Push] Não foi possível concluir reserva:', err);
  }
}

async function sendOnce(uid: string, type: string, origin: string, title: string, body: string, url: string): Promise<boolean> {
  const { acquired, ref } = await acquireLock(uid, type, origin);
  if (!acquired) return false;
  let sent = false;
  try {
    const count = await notificationService.sendPushToUser(uid, { title, body, data: { url } });
    sent = count > 0;
    return sent;
  } catch (err) {
    console.error('[Push] Falha ao enviar:', err);
    return false;
  } finally {
    await completeLock(ref, sent);
  }
}

export async function checkAgendaReminders(uidFilter: string | null = null): Promise<number> {
  const db = getServerDb();
  const now = Date.now();
  // Reduz leituras no plano Spark: janela de um dia à frente + compromissos recorrentes.
  const [range, recurring] = await Promise.all([
    db.collection('agenda').where('date', '>=', now - 20 * 60_000)
      .where('date', '<=', now + 24 * 60 * 60_000 + 20 * 60_000).get(),
    db.collection('agenda').where('recurrence', 'in', ['daily', 'weekly', 'monthly']).get(),
  ]);
  const unique = new Map<string, typeof range.docs[number]>();
  for (const doc of [...range.docs, ...recurring.docs]) unique.set(doc.id, doc);

  let count = 0;
  for (const doc of unique.values()) {
    const event = doc.data();
    const uid = event.userId;
    if (!uid || (uidFilter && uid !== uidFilter)) continue;
    const due = getDueReminder(event as any, now);
    if (!due) continue;
    const origin = `${doc.id}:${due.occurrenceAt}:${event.notifyTime}`;
    const body = `O compromisso "${String(event.title || 'Compromisso')}" ${due.label}`;
    if (await sendOnce(uid, 'agenda', origin, `Compromisso: ${String(event.title || 'Agenda')}`, body, '/app/agenda')) count++;
  }
  return count;
}

export async function checkLeads2h(uidFilter: string | null = null): Promise<number> {
  const snapshot = await getServerDb().collection('leads').where('status', '==', 'new').get();
  let count = 0;
  const cutoff = Date.now() - 2 * 60 * 60_000;
  for (const doc of snapshot.docs) {
    const x = doc.data();
    if (!x.userId || (uidFilter && x.userId !== uidFilter) || !x.createdAt || Number(x.createdAt) > cutoff) continue;
    if (await sendOnce(x.userId, 'lead_2h', doc.id, 'Novo lead aguardando atendimento',
      `O lead "${x.name || 'Novo contato'}" aguarda atendimento há mais de 2 horas.`, '/app/leads')) count++;
  }
  return count;
}

export async function checkQuotes48h(uidFilter: string | null = null): Promise<number> {
  const snapshot = await getServerDb().collection('quotes').where('status', '==', 'pending').get();
  let count = 0;
  const cutoff = Date.now() - 48 * 60 * 60_000;
  for (const doc of snapshot.docs) {
    const x = doc.data();
    if (!x.userId || (uidFilter && x.userId !== uidFilter) || !x.createdAt || Number(x.createdAt) > cutoff) continue;
    if (await sendOnce(x.userId, 'quote_48h', doc.id, 'Orçamento aguardando follow-up',
      `O orçamento de "${x.clientName || 'Cliente'}" aguarda retorno há mais de 48 horas.`, '/app/quotes')) count++;
  }
  return count;
}

export async function checkFinancialOverdue(uidFilter: string | null = null): Promise<number> {
  const snapshot = await getServerDb().collection('financial_transactions').where('status', '==', 'pending').get();
  let count = 0;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  for (const doc of snapshot.docs) {
    const x = doc.data();
    if (!x.userId || (uidFilter && x.userId !== uidFilter) || !x.dueDate || Number(x.dueDate) >= todayStart) continue;
    if (await sendOnce(x.userId, 'financial_overdue', doc.id, 'Conta a receber vencida',
      `O lançamento "${x.description || 'Recebimento'}" está vencido.`, '/app/financial')) count++;
  }
  return count;
}

export async function runAllAutomations(): Promise<AutomationSummary> {
  const uid = scopedUid(); // Preview sem UID autorizado NUNCA dispara alertas.
  if (!await ensureAuthenticated()) throw new Error('FIREBASE_ADMIN_UNAVAILABLE');
  const summary: AutomationSummary = {
    agendaNotified: 0, leadsNotified: 0, quotesNotified: 0, financialOverdueNotified: 0,
  };
  for (const [name, fn] of [
    ['agendaNotified', checkAgendaReminders],
    ['leadsNotified', checkLeads2h],
    ['quotesNotified', checkQuotes48h],
    ['financialOverdueNotified', checkFinancialOverdue],
  ] as const) {
    try { summary[name] = await fn(uid); }
    catch (error) { console.error(`[Push Scheduler] Falha em ${name}:`, error); }
  }
  return summary;
}

export async function checkAndSendNotifications(): Promise<void> {
  if (processing) return;
  processing = true;
  try { await runAllAutomations(); }
  catch (error) { console.error('[Push Scheduler]', error); }
  finally { processing = false; }
}

export function startScheduler(intervalMs = 30_000): void {
  if (intervalId) return;
  intervalId = setInterval(checkAndSendNotifications, intervalMs);
}

export function stopScheduler(): void {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
}
