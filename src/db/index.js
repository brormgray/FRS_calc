import Dexie from 'dexie';
import { ADVISOR_STORAGE_KEY, DEFAULT_ADVISOR_INFO } from '../constants/pension.js';

/**
 * FRS Database Class using Dexie (IndexedDB)
 * Provides local-first, durable persistence for offline field work.
 */
export class FRSDatabase extends Dexie {
  constructor() {
    super('frs_estimator_db');

    // Define database schema
    this.version(1).stores({
      advisor: 'id, name, email, phone, firm, title, updatedAt',
      consultations: '++id, clientName, clientEmail, agency, createdAt, updatedAt',
      settings: 'key',
    });

    this.advisor = this.table('advisor');
    this.consultations = this.table('consultations');
    this.settings = this.table('settings');
  }
}

export const db = new FRSDatabase();

/**
 * Requests high-persistence storage from the browser (protects from mobile OS eviction)
 * @returns {Promise<boolean>} True if storage is guaranteed durable
 */
export async function requestPersistentStorage() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.info(`[FRS Storage] Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    }
  } catch (err) {
    console.warn('[FRS Storage] Error requesting persistent storage:', err);
  }
  return false;
}

/**
 * Checks if current storage is persisted
 * @returns {Promise<boolean>}
 */
export async function isStoragePersisted() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      return await navigator.storage.persisted();
    }
  } catch (err) {
    console.warn('[FRS Storage] Error checking persistence:', err);
  }
  return false;
}

/**
 * Retrieves storage usage and quota
 * @returns {Promise<{ quota: number, usage: number, percentUsed: string } | null>}
 */
export async function getStorageQuota() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        percentUsed: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : '0',
      };
    }
  } catch (err) {
    console.warn('[FRS Storage] Error estimating quota:', err);
  }
  return null;
}

/**
 * Migrates legacy localStorage advisor profile into Dexie if empty
 */
export async function migrateFromLocalStorage() {
  try {
    const existing = await db.advisor.get('default');
    if (!existing && typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(ADVISOR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        await db.advisor.put({
          id: 'default',
          ...DEFAULT_ADVISOR_INFO,
          ...parsed,
          updatedAt: new Date().toISOString(),
        });
        console.info('[FRS Storage] Migrated legacy advisor profile from localStorage to DexieDB');
      }
    }
  } catch (err) {
    console.warn('[FRS Storage] Migration warning:', err);
  }
}

/**
 * Gets advisor profile with fallback to defaults
 * @returns {Promise<Object>}
 */
export async function getAdvisorProfile() {
  try {
    const record = await db.advisor.get('default');
    if (record) {
      return { ...DEFAULT_ADVISOR_INFO, ...record };
    }
    // Check localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(ADVISOR_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_ADVISOR_INFO, ...JSON.parse(saved) };
      }
    }
  } catch (err) {
    console.warn('[FRS Storage] Error getting advisor profile:', err);
  }
  return { ...DEFAULT_ADVISOR_INFO };
}

/**
 * Saves advisor profile to DexieDB and mirrors to localStorage
 * @param {Object} profile
 * @returns {Promise<Object>}
 */
export async function saveAdvisorProfile(profile) {
  const toSave = {
    id: 'default',
    ...DEFAULT_ADVISOR_INFO,
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  try {
    await db.advisor.put(toSave);
    // Mirror to localStorage for extra fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(ADVISOR_STORAGE_KEY, JSON.stringify(toSave));
    }
  } catch (err) {
    console.warn('[FRS Storage] Error saving to DexieDB, writing to localStorage fallback:', err);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(ADVISOR_STORAGE_KEY, JSON.stringify(toSave));
    }
  }
  return toSave;
}

/**
 * Saves a completed client consultation / estimate
 * @param {Object} param0
 * @returns {Promise<number>} ID of saved consultation
 */
export async function saveConsultation({
  id,
  clientName,
  clientEmail,
  agency,
  formData,
  calculations,
  notes = '',
}) {
  const now = new Date().toISOString();
  const selectedOpt = formData?.selectedOption || 1;
  const grossMonthly = calculations?.options?.[selectedOpt]?.grossMonthlyBenefit || 0;
  const dropTotal = calculations?.dropTotalAccumulation || 0;

  const record = {
    clientName: (clientName || formData?.name || 'Unnamed Client').trim(),
    clientEmail: (clientEmail || formData?.email || '').trim(),
    agency: (agency || formData?.agency || '').trim(),
    selectedOption: selectedOpt,
    grossMonthlyBenefit: grossMonthly,
    dropTotalAccumulation: dropTotal,
    formData: { ...formData },
    calculations: calculations ? { ...calculations } : null,
    notes,
    updatedAt: now,
  };

  if (id) {
    record.id = id;
    await db.consultations.put(record);
    return id;
  } else {
    record.createdAt = now;
    const newId = await db.consultations.add(record);
    return newId;
  }
}

/**
 * Retrieves all saved consultations sorted by most recent
 * @returns {Promise<Array>}
 */
export async function getAllConsultations() {
  try {
    return await db.consultations.orderBy('createdAt').reverse().toArray();
  } catch (err) {
    console.warn('[FRS Storage] Error fetching consultations:', err);
    return [];
  }
}

/**
 * Retrieves a single consultation by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getConsultation(id) {
  try {
    return await db.consultations.get(id);
  } catch (err) {
    console.warn(`[FRS Storage] Error fetching consultation ${id}:`, err);
    return null;
  }
}

/**
 * Deletes a consultation by ID
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteConsultation(id) {
  try {
    await db.consultations.delete(id);
  } catch (err) {
    console.warn(`[FRS Storage] Error deleting consultation ${id}:`, err);
    throw err;
  }
}

/**
 * Exports entire local database to a secure JSON file for local backup
 * @returns {Promise<string>} JSON string
 */
export async function exportDatabaseBackup() {
  const [advisor, consultations, settings] = await Promise.all([
    db.advisor.toArray(),
    db.consultations.toArray(),
    db.settings.toArray(),
  ]);

  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    advisor,
    consultations,
    settings,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Imports a JSON database backup inside an atomic transaction
 * @param {string|Object} backupInput
 * @returns {Promise<{ restoredConsultations: number, advisorUpdated: boolean }>}
 */
export async function importDatabaseBackup(backupInput) {
  const data = typeof backupInput === 'string' ? JSON.parse(backupInput) : backupInput;

  if (!data || !Array.isArray(data.consultations)) {
    throw new Error('Invalid backup file structure: missing consultations data');
  }

  let restoredConsultations = 0;
  let advisorUpdated = false;

  await db.transaction('rw', db.advisor, db.consultations, db.settings, async () => {
    // Restore advisor if present
    if (Array.isArray(data.advisor) && data.advisor.length > 0) {
      for (const adv of data.advisor) {
        await db.advisor.put(adv);
        advisorUpdated = true;
      }
    }

    // Restore consultations
    for (const c of data.consultations) {
      // Avoid ID clashes by letting new entries preserve or add
      await db.consultations.put(c);
      restoredConsultations++;
    }

    // Restore settings
    if (Array.isArray(data.settings)) {
      for (const s of data.settings) {
        await db.settings.put(s);
      }
    }
  });

  return { restoredConsultations, advisorUpdated };
}
