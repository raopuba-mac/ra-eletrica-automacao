export interface VoiceExtractorRequestBody {
  text: string;
}

export interface BudgetItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ExtractedBudgetData {
  description: string;
  items: BudgetItem[];
  remarks: string;
  includesMaterial: boolean;
  discount: number;
}

export interface PushSubscriptionItem {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscribeRequestBody {
  subscription: PushSubscriptionItem;
  userId: string;
}

export interface PushTestRequestBody {
  userId: string;
  title?: string;
  body?: string;
}

export interface AgendaEvent {
  id: string;
  title?: string;
  description?: string;
  date?: number;
  userId?: string;
  notifyTime?: 'none' | 'at_event' | '15_min' | '1_hour' | '24_hours';
  notified?: boolean;
}
