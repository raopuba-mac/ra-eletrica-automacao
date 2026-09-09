import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import { db, ensureAuthenticated, notificationService } from './notification.service.js';

let intervalId: NodeJS.Timeout | null = null;
let isProcessing = false;

export interface AutomationSummary {
  agendaNotified: number;
  leadsNotified: number;
  quotesNotified: number;
  financialOverdueNotified: number;
}

async function acquireNotificationLock(
  userId: string,
  type: string,
  originId: string
): Promise<{ acquired: boolean; eventDocRef: any }> {
  const eventKey = `${userId}_${type}_${originId}`.replace(/[^a-zA-Z0-9_]/g, '_');
  const eventDocRef = doc(db, 'notification_events', eventKey);

  try {
    const acquired = await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(eventDocRef);
      if (sfDoc.exists()) {
        const data = sfDoc.data();
        if (data.status === 'sent') {
          return false;
        }
        if (data.status === 'processing') {
          const processingTimeoutMs = 5 * 60 * 1000;
          if (Date.now() - (data.reservedAt || 0) < processingTimeoutMs) {
            return false;
          }
        }
        transaction.update(eventDocRef, {
          status: 'processing',
          reservedAt: Date.now(),
        });
        return true;
      }

      transaction.set(eventDocRef, {
        userId,
        type,
        originId,
        status: 'processing',
        reservedAt: Date.now(),
      });
      return true;
    });

    return { acquired, eventDocRef };
  } catch (err) {
    console.error(`[Notification Lock Error] Key: ${eventKey}:`, err);
    return { acquired: false, eventDocRef };
  }
}

async function releaseOrCompleteLock(eventDocRef: any, success: boolean): Promise<void> {
  try {
    if (success) {
      await updateDoc(eventDocRef, {
        status: 'sent',
        sentAt: Date.now(),
      });
    } else {
      await updateDoc(eventDocRef, {
        status: 'failed',
        failedAt: Date.now(),
      });
    }
  } catch (err) {
    console.error('[Notification Lock Finalize Error]:', err);
  }
}

export async function checkAgendaReminders(): Promise<number> {
  let count = 0;
  const now = Date.now();
  const agendaRef = collection(db, 'agenda');
  const querySnapshot = await getDocs(
    query(agendaRef, where('notified', '!=', true))
  );

  for (const d of querySnapshot.docs) {
    const event = { id: d.id, ...d.data() } as any;
    if (!event.date || !event.userId || event.notifyTime === 'none') continue;

    const diffMs = event.date - now;
    let shouldNotify = false;
    let timeLabel = '';

    // Tolerance windows
    if (event.notifyTime === 'at_event') {
      if (diffMs <= 60000 && diffMs >= -120000) {
        shouldNotify = true;
        timeLabel = 'está agendado para agora!';
      }
    } else if (event.notifyTime === '15_min') {
      if (diffMs <= 16 * 60000 && diffMs >= 14 * 60000) {
        shouldNotify = true;
        timeLabel = 'começa em 15 minutos.';
      }
    } else if (event.notifyTime === '1_hour') {
      if (diffMs <= 61 * 60000 && diffMs >= 59 * 60000) {
        shouldNotify = true;
        timeLabel = 'começa em 1 hora.';
      }
    } else if (event.notifyTime === '24_hours') {
      if (diffMs <= 24.1 * 60 * 60000 && diffMs >= 23.9 * 60 * 60000) {
        shouldNotify = true;
        timeLabel = 'está agendado para amanhã.';
      }
    }

    if (shouldNotify) {
      console.log(
        `[Push Scheduler] Enviando lembrete de compromisso: "${event.title}" para o usuário: ${event.userId}`
      );

      const sent = await notificationService.sendPushToUser(event.userId, {
        title: `Lembrete de Compromisso: ${event.title}`,
        body: `O seu agendamento "${event.title}" ${timeLabel}\nDetalhes: ${
          event.description || 'Sem descrição adicional'
        }`,
        data: { url: '/app/agenda' },
      });

      if (sent > 0) {
        count++;
      }
      await updateDoc(doc(db, 'agenda', event.id), { notified: true });
    }
  }

  return count;
}

export async function checkLeads2h(): Promise<number> {
  let count = 0;
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

  const leadsRef = collection(db, 'leads');
  const querySnapshot = await getDocs(
    query(leadsRef, where('status', '==', 'new'))
  );

  for (const d of querySnapshot.docs) {
    const lead = { id: d.id, ...d.data() } as any;
    if (!lead.userId || !lead.createdAt) continue;

    const createdAtMs = Number(lead.createdAt);
    if (isNaN(createdAtMs) || createdAtMs > twoHoursAgo) continue;

    const { acquired, eventDocRef } = await acquireNotificationLock(
      lead.userId,
      'lead_2h',
      lead.id
    );

    if (!acquired) {
      continue;
    }

    const leadName = lead.name || 'Novo contato';
    try {
      const sent = await notificationService.sendPushToUser(lead.userId, {
        title: 'Novo Lead Aguardando Atendimento',
        body: `O lead "${leadName}" foi recebido há mais de 2 horas e aguarda o primeiro contato.`,
        data: { url: '/app/leads' },
      });

      if (sent > 0) {
        count++;
        await releaseOrCompleteLock(eventDocRef, true);
      } else {
        await releaseOrCompleteLock(eventDocRef, false);
      }
    } catch (pushErr) {
      console.error(`[Push Lead Error] ${lead.id}:`, pushErr);
      await releaseOrCompleteLock(eventDocRef, false);
    }
  }

  return count;
}

export async function checkQuotes48h(): Promise<number> {
  let count = 0;
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;

  const quotesRef = collection(db, 'quotes');
  const querySnapshot = await getDocs(
    query(quotesRef, where('status', '==', 'pending'))
  );

  for (const d of querySnapshot.docs) {
    const quote = { id: d.id, ...d.data() } as any;
    if (!quote.userId || !quote.createdAt) continue;

    const createdAtMs = Number(quote.createdAt);
    if (isNaN(createdAtMs) || createdAtMs > fortyEightHoursAgo) continue;

    const { acquired, eventDocRef } = await acquireNotificationLock(
      quote.userId,
      'quote_48h',
      quote.id
    );

    if (!acquired) {
      continue;
    }

    const clientName = quote.clientName || 'Cliente';
    try {
      const sent = await notificationService.sendPushToUser(quote.userId, {
        title: 'Orçamento Pendente — Follow-up',
        body: `Há um orçamento para "${clientName}" aguardando follow-up há mais de 48 horas.`,
        data: { url: '/app/quotes' },
      });

      if (sent > 0) {
        count++;
        await releaseOrCompleteLock(eventDocRef, true);
      } else {
        await releaseOrCompleteLock(eventDocRef, false);
      }
    } catch (pushErr) {
      console.error(`[Push Quote Error] ${quote.id}:`, pushErr);
      await releaseOrCompleteLock(eventDocRef, false);
    }
  }

  return count;
}

export async function checkFinancialOverdue(): Promise<number> {
  let count = 0;
  const todayStartMs = new Date().setHours(0, 0, 0, 0);

  const finRef = collection(db, 'financial_transactions');
  const querySnapshot = await getDocs(
    query(finRef, where('status', '==', 'pending'))
  );

  for (const d of querySnapshot.docs) {
    const tx = { id: d.id, ...d.data() } as any;
    if (!tx.userId || !tx.dueDate) continue;

    const dueDateMs = Number(tx.dueDate);
    if (isNaN(dueDateMs) || dueDateMs >= todayStartMs) continue;

    const { acquired, eventDocRef } = await acquireNotificationLock(
      tx.userId,
      'financial_overdue',
      tx.id
    );

    if (!acquired) {
      continue;
    }

    const desc = tx.description || 'Lançamento pendente';
    const clientText = tx.clientName ? ` (${tx.clientName})` : '';

    try {
      const sent = await notificationService.sendPushToUser(tx.userId, {
        title: 'Conta a Receber Vencida',
        body: `O lançamento "${desc}"${clientText} está com a data de vencimento ultrapassada.`,
        data: { url: '/app/financial' },
      });

      if (sent > 0) {
        count++;
        await releaseOrCompleteLock(eventDocRef, true);
      } else {
        await releaseOrCompleteLock(eventDocRef, false);
      }
    } catch (pushErr) {
      console.error(`[Push Financial Error] ${tx.id}:`, pushErr);
      await releaseOrCompleteLock(eventDocRef, false);
    }
  }

  return count;
}

export async function runAllAutomations(): Promise<AutomationSummary> {
  const summary: AutomationSummary = {
    agendaNotified: 0,
    leadsNotified: 0,
    quotesNotified: 0,
    financialOverdueNotified: 0,
  };

  const authenticated = await ensureAuthenticated();
  if (!authenticated) {
    console.warn('[Push Scheduler] Autenticação do scheduler inativa ou sem credenciais.');
    return summary;
  }

  console.log('[Push Scheduler] Verificando automações RA ERP 5.0...');

  try {
    summary.agendaNotified = await checkAgendaReminders();
  } catch (err) {
    console.error('[Push Scheduler] Erro ao verificar agenda:', err);
  }

  try {
    summary.leadsNotified = await checkLeads2h();
  } catch (err) {
    console.error('[Push Scheduler] Erro ao verificar leads 2h:', err);
  }

  try {
    summary.quotesNotified = await checkQuotes48h();
  } catch (err) {
    console.error('[Push Scheduler] Erro ao verificar orçamentos 48h:', err);
  }

  try {
    summary.financialOverdueNotified = await checkFinancialOverdue();
  } catch (err) {
    console.error('[Push Scheduler] Erro ao verificar financeiro vencido:', err);
  }

  return summary;
}

export async function checkAndSendNotifications(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    await runAllAutomations();
  } catch (error) {
    console.error('[Push Scheduler] Erro na verificação em segundo plano:', error);
  } finally {
    isProcessing = false;
  }
}

export function startScheduler(intervalMs: number = 30000): void {
  if (intervalId) {
    console.log('[Push Scheduler] Scheduler já está rodando.');
    return;
  }
  console.log('[Push Server] Iniciando scheduler em segundo plano...');
  intervalId = setInterval(checkAndSendNotifications, intervalMs);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Push Scheduler] Scheduler parado.');
  }
}
