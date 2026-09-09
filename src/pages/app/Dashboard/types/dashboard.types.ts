export interface DashboardStatsData {
  clients: number;
  orders: number;
  leads: number;
  quotes: number;
}

export interface CommercialMetricsData {
  leadsNew: number;
  leadsContacted: number;
  leadsConverted: number;
  leadsTotal: number;
  quotesPending: number;
  quotesApproved: number;
  quotesRejected: number;
  quotesTotal: number;
  inNegotiationValue: number;
  conversionRate: number;
}

export interface DashboardClient {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  userId?: string;
  [key: string]: any;
}

export interface DashboardUpcomingEvent {
  id: string;
  title: string;
  date: number | string;
  time?: string;
  type?: string;
  userId?: string;
  description?: string;
  [key: string]: any;
}

export interface DashboardFinishedOrder {
  id: string;
  userId?: string;
  clientId?: string;
  description?: string;
  status?: string;
  finalPrice?: string;
  photos?: string[];
  photosAfter?: string[];
  updatedAt?: number;
  createdAt?: number;
  [key: string]: any;
}

export interface QuickIntakeFormData {
  quickClientName: string;
  quickClientPhone: string;
  quickClientAddress: string;
  quickDescription: string;
  quickType: 'os' | 'quote';
}

export interface DashboardLeadItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceType?: string;
  status: string;
  createdAt?: number;
  userId?: string;
}

export interface DashboardQuoteItem {
  id: string;
  clientId: string;
  clientName?: string;
  description?: string;
  totalAmount?: number;
  status: string;
  createdAt?: number;
  userId?: string;
}

export interface DashboardOrderItem {
  id: string;
  clientId?: string;
  description?: string;
  status?: string;
  finalPrice?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt?: number;
  updatedAt?: number;
  userId?: string;
}

export interface CopilotPriority {
  level: 'high' | 'medium' | 'low';
  title: string;
  reason: string;
  suggestedAction: string;
}

export interface CopilotOpportunity {
  title: string;
  description: string;
}

export interface CopilotNextAction {
  title: string;
  description: string;
}

export interface CopilotSuggestedMessage {
  targetId?: string;
  targetName: string;
  type?: 'lead' | 'quote' | string;
  phone?: string;
  message: string;
}

export interface CommercialCopilotResult {
  summary: string;
  priorities: CopilotPriority[];
  opportunities: CopilotOpportunity[];
  nextActions: CopilotNextAction[];
  suggestedMessages: CopilotSuggestedMessage[];
}

