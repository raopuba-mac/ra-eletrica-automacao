import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { ServiceOrderStatus, Client, ServiceOrder } from '../types/serviceOrder.types';
import { FinancialTransaction } from '../../Financial/types/financial.types';
import { getDerivedStatus } from '../../Financial/utils/financialUtils';

export const statusColors: Record<ServiceOrderStatus, string> = {
  scheduled: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const statusNames: Record<ServiceOrderStatus, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

export const sanitizeForPDF = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1F0FF}]/gu, '') // Remove wide emojis
    .replace(/[\u2022\u2023\u25B8\u2043\u2219]/g, '-') // Replace bullets with dash
    .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A]/g, "'") // Replace smart single quotes
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"') // Replace smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // Replace em/en dashes
    .replace(/[^\x00-\xFF\n\r]/g, ''); // Strip remaining non-Latin1 characters
};

export const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error loading image as base64", e);
    return '';
  }
};

export const getClientName = (clients: Client[], clientId: string): string => {
  return clients.find(c => c.id === clientId)?.name || 'Desconhecido';
};

export const shareWhatsApp = async (
  order: ServiceOrder,
  clients: Client[],
  financialTx?: FinancialTransaction | null
): Promise<void> => {
  const client = clients.find(c => c.id === order.clientId);
  if (!client || !client.phone) {
    alert('Cliente não encontrado ou sem telefone cadastrado.');
    return;
  }

  let token = order.shareToken;
  if (!token) {
    token = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    try {
      await updateDoc(doc(db, 'serviceOrders', order.id), {
        shareToken: token,
        updatedAt: Date.now()
      });
      order.shareToken = token;
    } catch (e) {
      console.warn('Erro ao atualizar shareToken na OS:', e);
    }
  }

  const phone = client.phone.replace(/\D/g, '');
  let text = '';

  const derivedTxStatus = financialTx ? getDerivedStatus(financialTx) : null;
  if (financialTx && (derivedTxStatus === 'pending' || derivedTxStatus === 'overdue')) {
    const formattedAmount = Number(financialTx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const dueDateStr = new Date(financialTx.dueDate).toLocaleDateString('pt-BR');
    text = `Olá, ${client.name}! Tudo bem?\n\nSegue a cobrança referente à Ordem de Serviço *#${order.id.slice(0, 8).toUpperCase()}*:\n\n🛠 *Descrição:* ${order.description}\n💰 *Valor:* R$ ${formattedAmount}\n📅 *Vencimento:* ${dueDateStr}\n\nQualquer dúvida estou à disposição para envio da chave PIX ou dados bancários!`;
  } else {
    const docUrl = window.location.origin + `/os/${order.id}?token=${token}`;
    const price = order.finalPrice ? `\n\n💰 *Valor do Investimento:* R$ ${Number(order.finalPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '';
    text = `Olá, ${client.name}! Tudo bem?\n\nA sua Ordem de Serviço foi atualizada para *Concluída*!\n\n🛠 *Descrição:* ${order.description}${price}\n\n✅ *Veja o comprovante completo com fotos de antes/depois no link abaixo:*\n${docUrl}\n\nMuito obrigado pela preferência!`;
  }

  const url = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};
