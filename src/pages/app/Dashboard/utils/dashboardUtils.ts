import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardClient, DashboardFinishedOrder } from '../types/dashboard.types';

export function formatEventDateMonth(dateValue: number | string): string {
  const dateObj = typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
  return format(dateObj, 'MMM', { locale: ptBR });
}

export function formatEventDateDay(dateValue: number | string): string {
  const dateObj = typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
  return format(dateObj, 'dd');
}

export function formatFinishedDate(timestamp?: number): string {
  if (!timestamp) return '--/--/--';
  return format(new Date(timestamp), 'dd/MM/yyyy');
}

export function buildWhatsAppShareUrl(order: DashboardFinishedOrder, client?: DashboardClient): string | null {
  if (!client || !client.phone) {
    return null;
  }

  const tokenQuery = order.shareToken ? `?token=${order.shareToken}` : '';
  const docUrl = window.location.origin + `/os/${order.id}${tokenQuery}`;
  const price = order.finalPrice
    ? `\n\n💰 *Valor do Investimento:* R$ ${Number(order.finalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : '';
  const text = `Olá, ${client.name}! Tudo bem?\n\nA sua Ordem de Serviço foi atualizada para *Concluída*!\n\n🛠 *Descrição:* ${order.description}${price}\n\n✅ *Veja o comprovante completo com fotos de antes/depois no link abaixo:*\n${docUrl}\n\nMuito obrigado pela preferência!`;

  const phone = client.phone.replace(/\D/g, '');
  return `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
}
