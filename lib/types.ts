export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'Other';

export type FinancialGoal =
  | 'save_more'
  | 'pay_debt'
  | 'stop_overspending'
  | 'build_emergency_fund'
  | 'prepare_big_purchase'
  | 'understand_spending';

export type RealityCheckTone = 'gentle' | 'direct' | 'spicy';

export type UserType = 
  | 'student'
  | 'young_professional'
  | 'salaried'
  | 'non_salaried'
  | 'freelancer'
  | 'retired';

export type IncomeRange =
  | 'below_25k'
  | '25k_50k'
  | '50k_100k'
  | '100k_200k'
  | 'above_200k';

export const USER_TYPE_LABELS: Record<UserType, string> = {
  student: 'Student',
  young_professional: 'Young Professional',
  salaried: 'Salaried Employee',
  non_salaried: 'Self-Employed / Business',
  freelancer: 'Freelancer / Gig Worker',
  retired: 'Retired',
};

export const USER_TYPE_SAVINGS_TIPS: Record<UserType, { savingsGoal: number; tips: string[] }> = {
  student: {
    savingsGoal: 10,
    tips: [
      'Track every expense, even small ones',
      'Use student discounts wherever possible',
      'Cook meals instead of eating out',
      'Build an emergency fund of 1-2 months expenses',
    ],
  },
  young_professional: {
    savingsGoal: 20,
    tips: [
      'Avoid lifestyle inflation as income grows',
      'Start investing early for compound growth',
      'Max out employer 401k match if available',
      'Build 3-month emergency fund',
    ],
  },
  salaried: {
    savingsGoal: 25,
    tips: [
      'Automate your savings on payday',
      'Review and optimize recurring subscriptions',
      'Plan major purchases in advance',
      'Build 6-month emergency fund',
    ],
  },
  non_salaried: {
    savingsGoal: 30,
    tips: [
      'Keep business and personal finances separate',
      'Save 30% of income for taxes',
      'Build 6-12 month emergency fund',
      'Plan for irregular income months',
    ],
  },
  freelancer: {
    savingsGoal: 25,
    tips: [
      'Invoice promptly and track payments',
      'Set aside money for dry periods',
      'Consider income averaging for budgeting',
      'Build 6-month emergency fund minimum',
    ],
  },
  retired: {
    savingsGoal: 15,
    tips: [
      'Focus on capital preservation',
      'Budget for healthcare costs',
      'Review withdrawal rate annually',
      'Consider part-time work for extra income',
    ],
  },
};

// Database types
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: UserType | null;
  income_range: IncomeRange | null;
  timezone: string;
  reminder_enabled: boolean;
  reminder_time: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  type: 'fixed' | 'variable';
  icon: string;
  color: string;
  budget_limit: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  expense_date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
}

export interface BudgetSettings {
  id: string;
  user_id: string;
  monthly_income: number;
  savings_goal_percent: number;
  financial_goal: FinancialGoal;
  tone: RealityCheckTone;
  report_frequency: 'weekly' | 'twice_monthly' | 'monthly';
  email_reports_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlySnapshot {
  id: string;
  user_id: string;
  month_year: string;
  total_income: number;
  total_expenses: number;
  total_savings: number;
  health_score: number;
  health_status: 'Stable' | 'Needs Attention' | 'Red Zone';
  expense_ratio: number;
  savings_rate: number;
  category_breakdown: Record<string, number> | null;
  top_spending_categories: { name: string; amount: number; percentage: number }[] | null;
  spending_leaks: SpendingLeak[] | null;
  report_summary: string | null;
  created_at: string;
}

export interface MonthlyComparison {
  current: MonthlySnapshot;
  previous: MonthlySnapshot | null;
  changes: {
    income_change: number;
    income_change_percent: number;
    expense_change: number;
    expense_change_percent: number;
    savings_change: number;
    savings_change_percent: number;
    health_score_change: number;
  };
  reasons: ChangeReason[];
}

export interface ChangeReason {
  category: string;
  type: 'increase' | 'decrease' | 'new' | 'removed';
  amount_change: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ScheduledReport {
  id: string;
  user_id: string;
  report_type: 'mid_month' | 'end_month' | 'reminder';
  report_data: BudgetReport | null;
  comparison_data: MonthlyComparison | null;
  change_reasons: ChangeReason[] | null;
  sent_at: string | null;
  email_status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

// Original budget types
export interface BudgetInput {
  monthlyIncome: number;
  currency: Currency;
  rent: number;
  groceries: number;
  eatingOut: number;
  transport: number;
  subscriptions: number;
  shopping: number;
  debtEmi: number;
  savingsInvestments: number;
  medical: number;
  familySupport: number;
  miscellaneous: number;
  financialGoal: FinancialGoal;
  tone: RealityCheckTone;
  notes?: string;
  // Dynamic categories from database
  customCategories?: Record<string, number>;
}

export interface NormalizedBudget {
  income: number;
  totalExpenses: number;
  monthlyBalance: number;
  expenseRatio: number;
  expenses: Record<string, number>;
  currency: Currency;
}

export interface CategorizedExpenses {
  fixed: {
    total: number;
    items: Record<string, number>;
  };
  flexible: {
    total: number;
    items: Record<string, number>;
  };
  savings: number;
}

export interface BudgetHealthScore {
  score: number;
  status: 'Stable' | 'Needs Attention' | 'Red Zone';
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

export interface SpendingLeak {
  category: string;
  amount: number;
  percentageOfIncome: number;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface RiskFlag {
  type: string;
  severity: 'warning' | 'danger';
  message: string;
  action: string;
}

export interface TriagePlan {
  day: number;
  action: string;
  category: string;
  expectedSaving: number;
}

export interface RecoveryMilestone {
  week: number;
  title: string;
  actions: string[];
  targetSaving: number;
}

export interface BudgetReport {
  normalizedBudget: NormalizedBudget;
  categorizedExpenses: CategorizedExpenses;
  healthScore: BudgetHealthScore;
  spendingLeaks: SpendingLeak[];
  riskFlags: RiskFlag[];
  triagePlan: TriagePlan[];
  recoveryWorkflow: RecoveryMilestone[];
  suggestedRules: string[];
  summary: string;
  input: BudgetInput;
  generatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowState {
  runId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStep: string | null;
  steps: WorkflowStep[];
  result?: BudgetReport;
  error?: string;
}

// Default expense categories for new users
export const DEFAULT_FIXED_CATEGORIES = [
  { name: 'Rent/Mortgage', icon: 'home', color: '#6366f1' },
  { name: 'Utilities', icon: 'zap', color: '#f59e0b' },
  { name: 'Insurance', icon: 'shield', color: '#10b981' },
  { name: 'Loan EMI', icon: 'credit-card', color: '#ef4444' },
  { name: 'Subscriptions', icon: 'tv', color: '#8b5cf6' },
];

export const DEFAULT_VARIABLE_CATEGORIES = [
  { name: 'Groceries', icon: 'shopping-cart', color: '#22c55e' },
  { name: 'Eating Out', icon: 'utensils', color: '#f97316' },
  { name: 'Transport', icon: 'car', color: '#3b82f6' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899' },
  { name: 'Entertainment', icon: 'film', color: '#a855f7' },
  { name: 'Medical', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Travel', icon: 'plane', color: '#06b6d4' },
  { name: 'Recreation', icon: 'gamepad-2', color: '#84cc16' },
  { name: 'Personal Care', icon: 'sparkles', color: '#f472b6' },
  { name: 'Miscellaneous', icon: 'more-horizontal', color: '#6b7280' },
];

export const SAMPLE_DATA = {
  youngProfessional: {
    monthlyIncome: 75000,
    currency: 'INR' as Currency,
    rent: 20000,
    groceries: 6000,
    eatingOut: 8000,
    transport: 4000,
    subscriptions: 2500,
    shopping: 5000,
    debtEmi: 0,
    savingsInvestments: 10000,
    medical: 1000,
    familySupport: 5000,
    miscellaneous: 4000,
    financialGoal: 'save_more' as FinancialGoal,
    tone: 'direct' as RealityCheckTone,
    notes: 'First job, want to build savings habit',
  },
  studentBudget: {
    monthlyIncome: 15000,
    currency: 'INR' as Currency,
    rent: 5000,
    groceries: 3000,
    eatingOut: 2000,
    transport: 1500,
    subscriptions: 500,
    shopping: 1000,
    debtEmi: 0,
    savingsInvestments: 500,
    medical: 500,
    familySupport: 0,
    miscellaneous: 1000,
    financialGoal: 'understand_spending' as FinancialGoal,
    tone: 'gentle' as RealityCheckTone,
    notes: 'Student allowance, trying to make it last',
  },
  salaryVanishing: {
    monthlyIncome: 100000,
    currency: 'INR' as Currency,
    rent: 30000,
    groceries: 8000,
    eatingOut: 15000,
    transport: 8000,
    subscriptions: 5000,
    shopping: 12000,
    debtEmi: 15000,
    savingsInvestments: 2000,
    medical: 2000,
    familySupport: 10000,
    miscellaneous: 8000,
    financialGoal: 'stop_overspending' as FinancialGoal,
    tone: 'spicy' as RealityCheckTone,
    notes: 'Where does my salary go every month?',
  },
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  Other: '',
};

export const FINANCIAL_GOAL_LABELS: Record<FinancialGoal, string> = {
  save_more: 'Save More',
  pay_debt: 'Pay Off Debt',
  stop_overspending: 'Stop Overspending',
  build_emergency_fund: 'Build Emergency Fund',
  prepare_big_purchase: 'Prepare for Big Purchase',
  understand_spending: 'Understand My Spending',
};

export const TONE_LABELS: Record<RealityCheckTone, string> = {
  gentle: 'Gentle',
  direct: 'Direct',
  spicy: 'Spicy but Useful',
};

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Singapore', label: 'Singapore Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];
