import { format } from 'date-fns';

export const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  contacted: 'Lido',
  converted: 'Convertido',
  archived: 'Arquivado',
};

export function formatLeadDate(createdAt?: number): string {
  if (!createdAt) return 'Data não disponível';
  try {
    return format(createdAt, 'dd/MM/yyyy HH:mm');
  } catch {
    return 'Data não disponível';
  }
}

export function cleanPhoneForWhatsApp(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}
