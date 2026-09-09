export function formatCurrency(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function calculateConversionRate(approvedCount: number, rejectedCount: number): number {
  const totalDecided = approvedCount + rejectedCount;
  if (totalDecided <= 0) return 0;
  return Math.round((approvedCount / totalDecided) * 100);
}

export function getQuoteAgeStatus(createdAt?: number) {
  if (!createdAt) {
    return {
      label: 'RECENTE',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      daysAgo: 0,
      priority: 'low' as const,
    };
  }
  const diffMs = Date.now() - createdAt;
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysAgo <= 1) {
    return {
      label: 'RECENTE',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      daysAgo,
      priority: 'low' as const,
    };
  } else if (daysAgo <= 3) {
    return {
      label: 'ACOMPANHAR',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      daysAgo,
      priority: 'medium' as const,
    };
  } else {
    return {
      label: 'FOLLOW-UP',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 font-black animate-pulse',
      daysAgo,
      priority: 'high' as const,
    };
  }
}

export function cleanPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function getQuoteWhatsAppUrl(
  quote: { clientId?: string; clientName?: string; totalAmount?: number; description?: string },
  clientPhone?: string
): string {
  const phoneToUse = clientPhone || quote.clientName || '';
  const number = cleanPhone(phoneToUse);
  if (!number) return '#';
  const clientName = quote.clientName || 'Cliente';
  const valStr = quote.totalAmount ? ` no valor de ${formatCurrency(quote.totalAmount)}` : '';
  const text = `Olá, ${clientName}! Tudo bem?\n\nPassando para saber se você teve oportunidade de analisar a nossa proposta comercial${valStr}? Qualquer dúvida ou ajuste, estou à disposição!`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function getLeadWhatsAppUrl(lead: { name: string; phone?: string; serviceType?: string }): string {
  const number = cleanPhone(lead.phone);
  if (!number) return '#';
  const text = `Olá, ${lead.name}! Recebemos sua mensagem referente a ${
    lead.serviceType || 'serviços elétricos e automação'
  }. Como posso te ajudar hoje?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
