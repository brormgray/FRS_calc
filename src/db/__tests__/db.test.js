import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  getAdvisorProfile,
  saveAdvisorProfile,
  saveConsultation,
  getAllConsultations,
  getConsultation,
  deleteConsultation,
  exportDatabaseBackup,
  importDatabaseBackup,
  migrateFromLocalStorage,
  requestPersistentStorage,
  isStoragePersisted,
  getStorageQuota,
} from '../index.js';
import { DEFAULT_ADVISOR_INFO, ADVISOR_STORAGE_KEY } from '../../constants/pension.js';

describe('Local DexieDB Database Layer', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.advisor.clear();
    await db.consultations.clear();
    await db.settings.clear();
  });

  it('retrieves default advisor profile when database is empty', async () => {
    const profile = await getAdvisorProfile();
    expect(profile.name).toBe('');
    expect(profile.firm).toBe(DEFAULT_ADVISOR_INFO.firm);
    expect(profile.title).toBe(DEFAULT_ADVISOR_INFO.title);
  });

  it('saves and updates advisor profile with persistence', async () => {
    const newProfile = {
      name: 'Jane Doe, CFP®',
      email: 'jane@floridaretire.com',
      phone: '(555) 019-2831',
      firm: 'Sunshine Financial',
      title: 'Senior FRS Specialist',
    };

    const saved = await saveAdvisorProfile(newProfile);
    expect(saved.id).toBe('default');
    expect(saved.name).toBe('Jane Doe, CFP®');

    const fetched = await getAdvisorProfile();
    expect(fetched.name).toBe('Jane Doe, CFP®');
    expect(fetched.firm).toBe('Sunshine Financial');
    expect(fetched.email).toBe('jane@floridaretire.com');
  });

  it('migrates legacy localStorage advisor info on first run', async () => {
    const legacy = {
      name: 'Legacy Advisor',
      email: 'legacy@state.fl.us',
      phone: '850-555-1234',
      firm: 'Legacy Firm',
      title: 'Advisor',
    };

    // Mock localStorage
    const originalLocalStorage = window.localStorage;
    const store = { [ADVISOR_STORAGE_KEY]: JSON.stringify(legacy) };
    window.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = val; },
    };

    await migrateFromLocalStorage();
    const fetched = await getAdvisorProfile();
    expect(fetched.name).toBe('Legacy Advisor');
    expect(fetched.email).toBe('legacy@state.fl.us');

    window.localStorage = originalLocalStorage;
  });

  it('saves, retrieves, and deletes client consultations', async () => {
    const consultation1 = {
      clientName: 'Officer John Smith',
      clientEmail: 'jsmith@sheriff.gov',
      agency: 'Orange County Sheriff',
      formData: {
        currentAge: 52,
        yearsEmployed: 25,
        annualSalary: 85000,
        jobClass: 'Special Risk',
        selectedOption: 1,
      },
      calculations: {
        options: {
          1: { grossMonthlyBenefit: 5312.5 },
        },
        dropTotalAccumulation: 250000,
      },
    };

    const id = await saveConsultation(consultation1);
    expect(id).toBeDefined();

    const fetched = await getConsultation(id);
    expect(fetched.clientName).toBe('Officer John Smith');
    expect(fetched.grossMonthlyBenefit).toBe(5312.5);
    expect(fetched.dropTotalAccumulation).toBe(250000);

    const all = await getAllConsultations();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(id);

    await deleteConsultation(id);
    const afterDelete = await getAllConsultations();
    expect(afterDelete.length).toBe(0);
  });

  it('exports and restores complete JSON database backups atomically', async () => {
    await saveAdvisorProfile({
      name: 'Export Test Advisor',
      firm: 'Test Advisory Group',
    });

    await saveConsultation({
      clientName: 'Client Alpha',
      clientEmail: 'alpha@example.com',
      formData: { selectedOption: 1 },
      calculations: { options: { 1: { grossMonthlyBenefit: 3000 } } },
    });

    const backupJson = await exportDatabaseBackup();
    const parsed = JSON.parse(backupJson);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.advisor.length).toBe(1);
    expect(parsed.consultations.length).toBe(1);

    // Clear database to simulate restore onto fresh device
    await db.advisor.clear();
    await db.consultations.clear();

    const result = await importDatabaseBackup(backupJson);
    expect(result.restoredConsultations).toBe(1);
    expect(result.advisorUpdated).toBe(true);

    const restoredProfile = await getAdvisorProfile();
    expect(restoredProfile.name).toBe('Export Test Advisor');

    const restoredConsultations = await getAllConsultations();
    expect(restoredConsultations.length).toBe(1);
    expect(restoredConsultations[0].clientName).toBe('Client Alpha');
  });

  it('handles persistence and storage quota API safely without crashing', async () => {
    // navigator.storage mock
    const originalNavigator = global.navigator;
    global.navigator = {
      ...originalNavigator,
      storage: {
        persist: async () => true,
        persisted: async () => true,
        estimate: async () => ({ quota: 1000000000, usage: 5000000 }),
      },
    };

    const isPersisted = await requestPersistentStorage();
    expect(isPersisted).toBe(true);

    const status = await isStoragePersisted();
    expect(status).toBe(true);

    const quota = await getStorageQuota();
    expect(quota).not.toBeNull();
    expect(quota.percentUsed).toBe('0.50');

    global.navigator = originalNavigator;
  });
});
