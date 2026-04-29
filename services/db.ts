
import Dexie, { type Table } from 'dexie';
import { Transaction, Saving, Business } from '../types';

/**
 * DigiSheDB class definition.
 * Extends Dexie to provide a local offline-first database using IndexedDB.
 */
export class DigiSheDB extends Dexie {
  businesses!: Table<Business>;
  transactions!: Table<Transaction>;
  savings!: Table<Saving>;
  profiles!: Table<{ phone: string; name: string; has_completed_onboarding: boolean; is_admin: boolean }>;
  pending_deletions!: Table<{ id: string; type: 'transaction' | 'saving' }>;

  constructor() {
    super('DigiSheDB');
    
    // Fix: Using the default import for Dexie instead of a named import ensures that
    // the class inheritance is correctly understood by TypeScript, making 'version'
    // and other base class methods available on 'this'.
    this.version(1).stores({
      businesses: 'id, user_id, synced',
      transactions: 'id, businessId, type, synced',
      savings: 'id, businessId, synced',
      profiles: 'phone',
      pending_deletions: 'id, type'
    });
  }
}

export const db = new DigiSheDB();
