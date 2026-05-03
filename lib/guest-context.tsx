'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserType, Profile, BudgetSettings, ExpenseCategory, Expense } from '@/lib/types';

interface GuestData {
  profile: Partial<Profile>;
  settings: Partial<BudgetSettings>;
  categories: ExpenseCategory[];
  expenses: Expense[];
}

interface GuestContextType {
  isGuest: boolean;
  guestData: GuestData | null;
  isSetupComplete: boolean;
  setGuestMode: (enabled: boolean, userType?: UserType) => void;
  completeSetup: () => void;
  updateGuestProfile: (profile: Partial<Profile>) => void;
  updateGuestSettings: (settings: Partial<BudgetSettings>) => void;
  addGuestCategory: (category: Omit<ExpenseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => ExpenseCategory;
  updateGuestCategory: (id: string, category: Partial<ExpenseCategory>) => void;
  deleteGuestCategory: (id: string) => void;
  addGuestExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Expense;
  updateGuestExpense: (id: string, expense: Partial<Expense>) => void;
  deleteGuestExpense: (id: string) => void;
  clearGuestData: () => void;
}

const GUEST_STORAGE_KEY = 'budget_check_guest_data';

const defaultCategories: Omit<ExpenseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Rent/Housing', type: 'fixed', icon: 'home', color: '#6366f1', budget_limit: null, is_default: true },
  { name: 'Utilities', type: 'fixed', icon: 'zap', color: '#f59e0b', budget_limit: null, is_default: true },
  { name: 'Insurance', type: 'fixed', icon: 'shield', color: '#10b981', budget_limit: null, is_default: true },
  { name: 'Groceries', type: 'variable', icon: 'shopping-cart', color: '#ef4444', budget_limit: null, is_default: true },
  { name: 'Dining Out', type: 'variable', icon: 'utensils', color: '#f97316', budget_limit: null, is_default: true },
  { name: 'Transportation', type: 'variable', icon: 'car', color: '#3b82f6', budget_limit: null, is_default: true },
  { name: 'Entertainment', type: 'variable', icon: 'tv', color: '#8b5cf6', budget_limit: null, is_default: true },
  { name: 'Shopping', type: 'variable', icon: 'shopping-bag', color: '#ec4899', budget_limit: null, is_default: true },
  { name: 'Health', type: 'variable', icon: 'heart', color: '#14b8a6', budget_limit: null, is_default: true },
  { name: 'Travel', type: 'variable', icon: 'plane', color: '#06b6d4', budget_limit: null, is_default: true },
  { name: 'Recreation', type: 'variable', icon: 'gamepad', color: '#a855f7', budget_limit: null, is_default: true },
];

const GuestContext = createContext<GuestContextType | undefined>(undefined);

function generateId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Load guest data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGuestData(parsed);
        setIsGuest(true);
        // Check if setup is complete (has income set)
        setIsSetupComplete(parsed.settings?.monthly_income > 0);
      } catch {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }
  }, []);

  // Save guest data to localStorage whenever it changes
  useEffect(() => {
    if (guestData) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestData));
    }
  }, [guestData]);

  const setGuestMode = (enabled: boolean, userType?: UserType) => {
    if (enabled) {
      const now = new Date().toISOString();
      const initialCategories: ExpenseCategory[] = defaultCategories.map((cat) => ({
        ...cat,
        id: generateId(),
        user_id: 'guest',
        created_at: now,
        updated_at: now,
      }));

      const newGuestData: GuestData = {
        profile: {
          id: 'guest',
          email: 'guest@local',
          full_name: 'Guest User',
          user_type: userType || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          reminder_enabled: false,
          onboarding_completed: true,
          created_at: now,
          updated_at: now,
        },
        settings: {
          monthly_income: 0,
          savings_goal_percent: 20,
          financial_goal: 'understand_spending',
          tone: 'direct',
          email_reports_enabled: false,
        },
        categories: initialCategories,
        expenses: [],
      };
      setGuestData(newGuestData);
      setIsGuest(true);
    } else {
      clearGuestData();
    }
  };

  const completeSetup = () => {
    setIsSetupComplete(true);
  };

  const updateGuestProfile = (profile: Partial<Profile>) => {
    if (!guestData) return;
    setGuestData({
      ...guestData,
      profile: { ...guestData.profile, ...profile, updated_at: new Date().toISOString() },
    });
  };

  const updateGuestSettings = (settings: Partial<BudgetSettings>) => {
    if (!guestData) return;
    setGuestData({
      ...guestData,
      settings: { ...guestData.settings, ...settings },
    });
  };

  const addGuestCategory = (category: Omit<ExpenseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>): ExpenseCategory => {
    const now = new Date().toISOString();
    const newCategory: ExpenseCategory = {
      ...category,
      id: generateId(),
      user_id: 'guest',
      created_at: now,
      updated_at: now,
    };
    if (guestData) {
      setGuestData({
        ...guestData,
        categories: [...guestData.categories, newCategory],
      });
    }
    return newCategory;
  };

  const updateGuestCategory = (id: string, category: Partial<ExpenseCategory>) => {
    if (!guestData) return;
    setGuestData({
      ...guestData,
      categories: guestData.categories.map((c) =>
        c.id === id ? { ...c, ...category, updated_at: new Date().toISOString() } : c
      ),
    });
  };

  const deleteGuestCategory = (id: string) => {
    if (!guestData) return;
    setGuestData({
      ...guestData,
      categories: guestData.categories.filter((c) => c.id !== id),
    });
  };

  const addGuestExpense = (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Expense => {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      user_id: 'guest',
      created_at: now,
      updated_at: now,
    };
    if (guestData) {
      setGuestData({
        ...guestData,
        expenses: [...guestData.expenses, newExpense],
      });
    }
    return newExpense;
  };

  const updateGuestExpense = (id: string, expense: Partial<Expense>) => {
    if (!guestData) return;
    setGuestData({
      ...guestData,
      expenses: guestData.expenses.map((e) =>
        e.id === id ? { ...e, ...expense, updated_at: new Date().toISOString() } : e
      ),
    });
  };

  const deleteGuestExpense = (id: string) => {
    if (!guestData) return;
    setGuestData({
      ...guestData,
      expenses: guestData.expenses.filter((e) => e.id !== id),
    });
  };

  const clearGuestData = () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setGuestData(null);
    setIsGuest(false);
  };

  return (
    <GuestContext.Provider
      value={{
        isGuest,
        guestData,
        isSetupComplete,
        setGuestMode,
        completeSetup,
        updateGuestProfile,
        updateGuestSettings,
        addGuestCategory,
        updateGuestCategory,
        deleteGuestCategory,
        addGuestExpense,
        updateGuestExpense,
        deleteGuestExpense,
        clearGuestData,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
}
