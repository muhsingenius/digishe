
export type BusinessType = 'Food' | 'Fashion' | 'Trading' | 'Production' | 'Services';

export interface User {
  phoneNumber: string;
  name: string;
  hasCompletedOnboarding: boolean;
}

export interface Business {
  name: string;
  type: BusinessType;
  location?: string;
  startDate: string;
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
