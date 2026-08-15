export interface SettingsFormData {
  name: string;
  companyName: string;
  phone: string;
  whatsappInfo: string;
  websiteSlug: string;
  bio: string;
}

export interface BackupCounts {
  clients: number;
  leads: number;
  quotes: number;
  serviceOrders: number;
  agenda: number;
  services: number;
  portfolio: number;
  site_settings: number;
  financial_transactions: number;
  total: number;
}

export interface BackupNormalizedData {
  clients: any[];
  leads: any[];
  quotes: any[];
  serviceOrders: any[];
  agenda: any[];
  services: any[];
  portfolio: any[];
  site_settings: any[];
  financial_transactions: any[];
}

export interface BackupPreviewSummary {
  version: number | string;
  app: string;
  exportedAt: string;
  counts: BackupCounts;
  normalizedData: BackupNormalizedData;
  profile: any;
}

export interface RestorationResult {
  restoredCount: number;
  failedCount: number;
  breakdown: Record<string, number>;
}

export interface BackupData {
  version: string | number;
  exportedAt: number | string;
  profile: any;
  data: {
    clients: any[];
    serviceOrders: any[];
    quotes: any[];
    agenda: any[];
    leads: any[];
    services?: any[];
    portfolio?: any[];
    site_settings?: any[];
    financial_transactions?: any[];
  };
}
