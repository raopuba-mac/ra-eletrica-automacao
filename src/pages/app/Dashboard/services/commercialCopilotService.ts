import { CommercialCopilotResult } from '../types/dashboard.types';
import { auth } from '../../../../lib/firebase';

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

  const response = await fetch('/api/chat/commercial-copilot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
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
