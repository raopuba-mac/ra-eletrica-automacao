import { CommercialCopilotResult } from '../types/dashboard.types';
import { auth } from '../../../../lib/firebase';

function extractReadableQuoteDescription(rawDesc: any): string {
  if (!rawDesc || typeof rawDesc !== 'string') return '';
  const trimmed = rawDesc.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const itemNames = Array.isArray(parsed.items)
        ? parsed.items
            .map((i: any) => (i?.name ? `${i.quantity || 1}x ${i.name}` : ''))
            .filter(Boolean)
            .join(', ')
        : '';
      const remarks = parsed.remarks ? String(parsed.remarks).trim() : '';
      return [itemNames, remarks].filter(Boolean).join(' — ').slice(0, 160);
    } catch {
      return trimmed.slice(0, 100);
    }
  }
  return trimmed.slice(0, 160);
}

export async function fetchCommercialCopilotAnalysis(payload: {
  leads: any[];
  quotes: any[];
  activeOrders: any[];
  metrics: any;
  customPrompt?: string;
}): Promise<CommercialCopilotResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Sessão expirada ou usuário não autenticado. Por favor, faça login novamente.');
  }

  const token = await currentUser.getIdToken().catch(() => null);
  if (!token) {
    throw new Error('Não foi possível obter o token de autenticação. Por favor, faça login novamente.');
  }

  const sanitizedPayload = {
    metrics: payload.metrics || {},
    customPrompt: payload.customPrompt ? String(payload.customPrompt).slice(0, 200) : undefined,
    leads: (payload.leads || []).slice(0, 15).map((l: any) => ({
      id: String(l?.id || ''),
      name: String(l?.name || 'Sem nome').slice(0, 50),
      phone: String(l?.phone || ''),
      serviceType: String(l?.serviceType || 'Serviço Geral').slice(0, 80),
      status: String(l?.status || 'new'),
      createdAt: l?.createdAt || null,
    })),
    quotes: (payload.quotes || []).slice(0, 15).map((q: any) => ({
      id: String(q?.id || ''),
      clientName: String(q?.clientName || 'Cliente').slice(0, 50),
      phone: String(q?.phone || ''),
      description: extractReadableQuoteDescription(q?.description),
      totalAmount: Number(q?.totalAmount) || 0,
      status: String(q?.status || 'pending'),
      createdAt: q?.createdAt || null,
    })),
    activeOrders: (payload.activeOrders || []).slice(0, 10).map((o: any) => ({
      id: String(o?.id || ''),
      clientName: String(o?.clientName || 'Cliente').slice(0, 50),
      description: String(o?.description || '').slice(0, 100),
      status: String(o?.status || 'scheduled'),
      scheduledDate: String(o?.scheduledDate || ''),
    })),
  };

  const response = await fetch('/api/chat/commercial-copilot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(sanitizedPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        'Falha ao conectar com o Copiloto Comercial. Tente novamente mais tarde.'
    );
  }

  const data = await response.json();
  return data as CommercialCopilotResult;
}
