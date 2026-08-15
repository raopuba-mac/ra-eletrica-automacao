export function formatBackupFileName(): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return `ra-erp-backup-v2-${dateStr}.json`;
}

export const LOGO_IMG_PATH = '/logo.jpg?v=6';
