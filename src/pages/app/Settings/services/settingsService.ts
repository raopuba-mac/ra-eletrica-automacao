import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  disableNetwork,
  enableNetwork,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../../../lib/error';
import {
  SettingsFormData,
  BackupData,
  BackupPreviewSummary,
  BackupCounts,
  RestorationResult,
} from '../types/settings.types';
import { formatBackupFileName, LOGO_IMG_PATH } from '../utils/settingsUtils';

function sanitizeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'object') {
    if (typeof data.toDate === 'function') {
      return data.toDate().getTime();
    }
    if (
      typeof data.seconds === 'number' &&
      typeof data.nanoseconds === 'number'
    ) {
      return data.seconds * 1000 + Math.floor(data.nanoseconds / 1000000);
    }
    if (Array.isArray(data)) {
      return data.map(sanitizeFirestoreData);
    }
    const result: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      result[key] = sanitizeFirestoreData(data[key]);
    }
    return result;
  }
  return data;
}

export const settingsService = {
  async getUserProfile(userId: string, authUser?: { displayName?: string | null; email?: string | null }): Promise<SettingsFormData | null> {
    try {
      let profile: SettingsFormData = {
        name: '',
        companyName: '',
        phone: '',
        whatsappInfo: '',
        websiteSlug: '',
        bio: '',
      };

      // 1. Prioritize reading existing data from users/{userId}
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        profile = {
          name: data.name || '',
          companyName: data.companyName || '',
          phone: data.phone || '',
          whatsappInfo: data.whatsappInfo || '',
          websiteSlug: data.websiteSlug || '',
          bio: data.bio || '',
        };
      }

      // 2. Fallback to site_settings/public_config for empty fields ONLY if it belongs to the authenticated user
      if (!profile.companyName || !profile.whatsappInfo || !profile.phone || !profile.name) {
        try {
          const configRef = doc(db, 'site_settings', 'public_config');
          const configSnap = await getDoc(configRef);
          if (configSnap.exists()) {
            const cfg = configSnap.data();
            const isOwner = cfg.userId === userId || cfg.ownerId === userId;
            if (isOwner) {
              if (!profile.companyName && cfg.companyName) profile.companyName = cfg.companyName;
              if (!profile.whatsappInfo && cfg.whatsappInfo) profile.whatsappInfo = cfg.whatsappInfo;
              if (!profile.phone && (cfg.phone || cfg.whatsappInfo)) profile.phone = cfg.phone || cfg.whatsappInfo;
              if (!profile.name && cfg.name) profile.name = cfg.name;
            }
          }
        } catch (_) {
          // Fallback reading silent catch
        }
      }

      // 3. Fallback to safe Auth info for name if still empty
      if (!profile.name && authUser?.displayName) {
        profile.name = authUser.displayName;
      }

      // 4. Remaining empty fields stay empty ("")

      return profile;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${userId}`);
      throw e;
    }
  },

  async saveUserProfile(userId: string, form: SettingsFormData): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, { ...form, updatedAt: Date.now() });
      } else {
        await setDoc(docRef, {
          ...form,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      throw err;
    }
  },

  async exportBackup(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const profile = userSnap.exists() ? userSnap.data() : null;

    const fetchCollection = async (colName: string) => {
      const snap = await getDocs(
        query(collection(db, colName), where('userId', '==', userId))
      );
      return snap.docs.map((d) => ({
        _id: d.id,
        ...d.data(),
      }));
    };

    const clients = await fetchCollection('clients');
    const leads = await fetchCollection('leads');
    const quotes = await fetchCollection('quotes');
    const serviceOrders = await fetchCollection('serviceOrders');
    const agenda = await fetchCollection('agenda');
    const services = await fetchCollection('services');
    const portfolio = await fetchCollection('portfolio');
    const financial_transactions = await fetchCollection('financial_transactions');

    const siteSettingsSnap = await getDocs(collection(db, 'site_settings'));
    const site_settings = siteSettingsSnap.docs.map((d) => ({
      _id: d.id,
      ...d.data(),
    }));

    const backupObj = {
      version: 2,
      app: 'RA ERP',
      exportedAt: new Date().toISOString(),
      userId,
      collections: [
        'clients',
        'leads',
        'quotes',
        'serviceOrders',
        'agenda',
        'services',
        'portfolio',
        'site_settings',
        'financial_transactions',
      ],
      profile: sanitizeFirestoreData(profile),
      data: {
        clients: sanitizeFirestoreData(clients),
        leads: sanitizeFirestoreData(leads),
        quotes: sanitizeFirestoreData(quotes),
        serviceOrders: sanitizeFirestoreData(serviceOrders),
        agenda: sanitizeFirestoreData(agenda),
        services: sanitizeFirestoreData(services),
        portfolio: sanitizeFirestoreData(portfolio),
        site_settings: sanitizeFirestoreData(site_settings),
        financial_transactions: sanitizeFirestoreData(financial_transactions),
      },
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', formatBackupFileName());
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  parseAndValidateBackup(fileContent: string): BackupPreviewSummary {
    let parsed: any;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      throw new Error(
        'Arquivo de backup inválido: o conteúdo não é um JSON válido ou está corrompido.'
      );
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(
        'Formato de arquivo incompatível: o backup deve ser um objeto JSON.'
      );
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      throw new Error(
        'Estrutura de dados inválida: o bloco "data" não foi encontrado no arquivo de backup.'
      );
    }

    let rawVersion = parsed.version;
    if (typeof rawVersion === 'number' && rawVersion > 2) {
      throw new Error(
        `Versão de backup (${rawVersion}) não suportada pelo sistema atual.`
      );
    }

    const dataObj = parsed.data;

    const extractArray = (key: string): any[] => {
      const val = dataObj[key];
      if (!Array.isArray(val)) return [];
      return val.filter((item) => item && typeof item === 'object');
    };

    const clients = extractArray('clients');
    const leads = extractArray('leads');
    const quotes = extractArray('quotes');
    const serviceOrders = extractArray('serviceOrders');
    const agenda = extractArray('agenda');
    const services = extractArray('services');
    const portfolio = extractArray('portfolio');
    const site_settings = extractArray('site_settings');
    const financial_transactions = extractArray('financial_transactions');

    const counts: BackupCounts = {
      clients: clients.length,
      leads: leads.length,
      quotes: quotes.length,
      serviceOrders: serviceOrders.length,
      agenda: agenda.length,
      services: services.length,
      portfolio: portfolio.length,
      site_settings: site_settings.length,
      financial_transactions: financial_transactions.length,
      total:
        clients.length +
        leads.length +
        quotes.length +
        serviceOrders.length +
        agenda.length +
        services.length +
        portfolio.length +
        site_settings.length +
        financial_transactions.length,
    };

    return {
      version: rawVersion || '1.0',
      app: parsed.app || 'RA ERP',
      exportedAt: parsed.exportedAt ? String(parsed.exportedAt) : 'Data não informada',
      counts,
      profile: parsed.profile || null,
      normalizedData: {
        clients,
        leads,
        quotes,
        serviceOrders,
        agenda,
        services,
        portfolio,
        site_settings,
        financial_transactions,
      },
    };
  },

  async importBackup(
    userId: string,
    previewSummary: BackupPreviewSummary
  ): Promise<RestorationResult> {
    if (!previewSummary || !previewSummary.normalizedData) {
      throw new Error('Dados de backup inválidos ou não analisados.');
    }

    const { profile, normalizedData } = previewSummary;
    let totalRestored = 0;
    let totalFailed = 0;
    const breakdown: Record<string, number> = {
      profile: 0,
      clients: 0,
      leads: 0,
      quotes: 0,
      serviceOrders: 0,
      agenda: 0,
      services: 0,
      portfolio: 0,
      site_settings: 0,
      financial_transactions: 0,
    };

    if (profile && typeof profile === 'object') {
      try {
        const userRef = doc(db, 'users', userId);
        const { updatedAt, createdAt, email, ...profileData } = profile;
        await setDoc(
          userRef,
          {
            ...profileData,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
        breakdown.profile = 1;
      } catch (err) {
        console.error('Erro ao restaurar perfil:', err);
      }
    }

    const restoreCollection = async (
      colName: string,
      items: any[],
      attachUserId: boolean = true
    ) => {
      let count = 0;
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        try {
          const docId = item.id || item._id || doc(collection(db, colName)).id;
          const { _id, id, ...docData } = item;

          if (attachUserId) {
            docData.userId = userId;
          }

          if (docData.createdAt !== undefined && docData.createdAt !== null) {
            const createdVal = Number(docData.createdAt);
            if (Number.isFinite(createdVal)) {
              docData.createdAt = createdVal;
            } else {
              delete docData.createdAt;
            }
          } else {
            delete docData.createdAt;
          }

          if (docData.updatedAt !== undefined && docData.updatedAt !== null) {
            const updatedVal = Number(docData.updatedAt);
            if (Number.isFinite(updatedVal)) {
              docData.updatedAt = updatedVal;
            } else {
              delete docData.updatedAt;
            }
          } else {
            delete docData.updatedAt;
          }

          await setDoc(doc(db, colName, docId), docData, { merge: true });
          count++;
          totalRestored++;
        } catch (itemErr) {
          console.error(`Erro ao restaurar item em ${colName}:`, itemErr);
          totalFailed++;
        }
      }
      breakdown[colName] = count;
    };

    await restoreCollection('clients', normalizedData.clients);
    await restoreCollection('leads', normalizedData.leads);
    await restoreCollection('quotes', normalizedData.quotes);
    await restoreCollection('serviceOrders', normalizedData.serviceOrders);
    await restoreCollection('agenda', normalizedData.agenda);
    await restoreCollection('services', normalizedData.services);
    await restoreCollection('portfolio', normalizedData.portfolio);
    await restoreCollection('site_settings', normalizedData.site_settings, false);
    await restoreCollection('financial_transactions', normalizedData.financial_transactions);

    return {
      restoredCount: totalRestored,
      failedCount: totalFailed,
      breakdown,
    };
  },

  async forceSyncData(): Promise<void> {
    await disableNetwork(db);
    await enableNetwork(db);
  },

  async downloadLogo(): Promise<void> {
    try {
      const response = await fetch(LOGO_IMG_PATH);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'RA_Logo_Clean_Professional.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading logo image:', err);
      window.open(LOGO_IMG_PATH, '_blank');
    }
  },
};

