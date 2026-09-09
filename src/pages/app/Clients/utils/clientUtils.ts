import { Client } from '../types/client.types';

export function filterClients(clients: Client[], searchTerm: string): Client[] {
  if (!searchTerm.trim()) return clients;
  const term = searchTerm.toLowerCase().trim();
  return clients.filter(
    (c) =>
      c.name.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term)
  );
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function formatDate(timestamp?: number | string): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
}
