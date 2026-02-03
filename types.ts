
export type BusinessType = 'Food' | 'Fashion' | 'Trading' | 'Production' | 'Services';

export interface User {
  phoneNumber: string;
  name: string;
  hasCompletedOnboarding: boolean;
  isAdmin: boolean;
}

export interface Business {
  id?: string;
  name: string;
  type: BusinessType;
  location?: string;
  startDate: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'sale' | 'expense';
  amount: number;
  category: string;
  date: string;
  note?: string;
}

export interface AppState {
  user: User | null;
  business: Business | null;
  transactions: Transaction[];
}
