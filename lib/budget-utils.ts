import type {
  BudgetInput,
  NormalizedBudget,
  CategorizedExpenses,
  BudgetHealthScore,
  SpendingLeak,
  RiskFlag,
  TriagePlan,
  RecoveryMilestone,
} from './types';

export function normalizeBudgetInput(input: BudgetInput): NormalizedBudget {
  const expenses: Record<string, number> = {
    rent: input.rent,
    groceries: input.groceries,
    eatingOut: input.eatingOut,
    transport: input.transport,
    subscriptions: input.subscriptions,
    shopping: input.shopping,
    debtEmi: input.debtEmi,
    medical: input.medical,
    familySupport: input.familySupport,
    miscellaneous: input.miscellaneous,
  };

  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
  const monthlyBalance = input.monthlyIncome - totalExpenses - input.savingsInvestments;
  const expenseRatio = input.monthlyIncome > 0 ? totalExpenses / input.monthlyIncome : 0;

  return {
    income: input.monthlyIncome,
    totalExpenses,
    monthlyBalance,
    expenseRatio,
    expenses,
    currency: input.currency,
  };
}

export function categorizeExpenses(input: BudgetInput): CategorizedExpenses {
  const fixed = {
    total: 0,
    items: {} as Record<string, number>,
  };
  const flexible = {
    total: 0,
    items: {} as Record<string, number>,
  };

  // Fixed expenses
  fixed.items.rent = input.rent;
  fixed.items.debtEmi = input.debtEmi;
  fixed.items.familySupport = input.familySupport;
  fixed.total = input.rent + input.debtEmi + input.familySupport;

  // Flexible expenses
  flexible.items.groceries = input.groceries;
  flexible.items.eatingOut = input.eatingOut;
  flexible.items.transport = input.transport;
  flexible.items.subscriptions = input.subscriptions;
  flexible.items.shopping = input.shopping;
  flexible.items.medical = input.medical;
  flexible.items.miscellaneous = input.miscellaneous;
  flexible.total = Object.values(flexible.items).reduce((sum, val) => sum + val, 0);

  return {
    fixed,
    flexible,
    savings: input.savingsInvestments,
  };
}

export function calculateBudgetHealthScore(
  normalized: NormalizedBudget,
  input: BudgetInput
): BudgetHealthScore {
  let score = 100;
  const factors: BudgetHealthScore['factors'] = [];

  const expenseRatioPercent = normalized.expenseRatio * 100;
  const savingsRatio = input.savingsInvestments / normalized.income;
  const debtRatio = input.debtEmi / normalized.income;
  const discretionaryRatio = (input.eatingOut + input.shopping + input.subscriptions) / normalized.income;
  const miscRatio = input.miscellaneous / normalized.income;

  // Expense ratio scoring
  if (expenseRatioPercent <= 70) {
    factors.push({
      name: 'Expense Control',
      impact: 0,
      description: 'Excellent! Expenses are under 70% of income.',
    });
  } else if (expenseRatioPercent <= 90) {
    const penalty = Math.round((expenseRatioPercent - 70) * 1.5);
    score -= penalty;
    factors.push({
      name: 'Expense Ratio',
      impact: -penalty,
      description: `Expenses at ${expenseRatioPercent.toFixed(0)}% of income. Aim for under 70%.`,
    });
  } else {
    const penalty = 30 + Math.round((expenseRatioPercent - 90) * 2);
    score -= penalty;
    factors.push({
      name: 'High Expenses',
      impact: -penalty,
      description: `Danger zone! Expenses at ${expenseRatioPercent.toFixed(0)}% of income.`,
    });
  }

  // Savings scoring
  if (savingsRatio >= 0.2) {
    factors.push({
      name: 'Savings Rate',
      impact: 5,
      description: 'Great savings rate of 20%+!',
    });
    score += 5;
  } else if (savingsRatio >= 0.1) {
    factors.push({
      name: 'Savings Rate',
      impact: 0,
      description: 'Decent savings rate. Aim for 20%+.',
    });
  } else {
    const penalty = Math.round((0.1 - savingsRatio) * 100);
    score -= penalty;
    factors.push({
      name: 'Low Savings',
      impact: -penalty,
      description: `Savings below 10% of income. This limits financial security.`,
    });
  }

  // Debt scoring
  if (debtRatio > 0.25) {
    const penalty = Math.round((debtRatio - 0.25) * 100);
    score -= penalty;
    factors.push({
      name: 'Debt Burden',
      impact: -penalty,
      description: `Debt/EMI exceeds 25% of income. This is a significant burden.`,
    });
  } else if (debtRatio > 0.15) {
    const penalty = 5;
    score -= penalty;
    factors.push({
      name: 'Debt Level',
      impact: -penalty,
      description: 'Debt is manageable but worth reducing.',
    });
  }

  // Discretionary spending
  if (discretionaryRatio > 0.25) {
    const penalty = Math.round((discretionaryRatio - 0.25) * 60);
    score -= penalty;
    factors.push({
      name: 'Lifestyle Spending',
      impact: -penalty,
      description: 'Eating out, shopping, and subscriptions are high.',
    });
  }

  // Miscellaneous tracking
  if (miscRatio > 0.15) {
    const penalty = Math.round((miscRatio - 0.15) * 50);
    score -= penalty;
    factors.push({
      name: 'Untracked Spending',
      impact: -penalty,
      description: 'High miscellaneous spending suggests tracking issues.',
    });
  }

  // Negative balance
  if (normalized.monthlyBalance < 0) {
    score -= 20;
    factors.push({
      name: 'Negative Balance',
      impact: -20,
      description: 'You are spending more than you earn!',
    });
  }

  score = Math.max(0, Math.min(100, score));

  let status: BudgetHealthScore['status'];
  if (score >= 70) {
    status = 'Stable';
  } else if (score >= 40) {
    status = 'Needs Attention';
  } else {
    status = 'Red Zone';
  }

  return { score, status, factors };
}

export function detectSpendingLeaks(
  normalized: NormalizedBudget,
  input: BudgetInput
): SpendingLeak[] {
  const leaks: SpendingLeak[] = [];
  const income = normalized.income;

  const checkLeak = (
    category: string,
    amount: number,
    thresholdPercent: number,
    suggestion: string
  ) => {
    const percent = (amount / income) * 100;
    if (percent > thresholdPercent && amount > 0) {
      let severity: SpendingLeak['severity'] = 'low';
      if (percent > thresholdPercent * 2) severity = 'high';
      else if (percent > thresholdPercent * 1.5) severity = 'medium';

      leaks.push({
        category,
        amount,
        percentageOfIncome: percent,
        severity,
        suggestion,
      });
    }
  };

  checkLeak(
    'Eating Out',
    input.eatingOut,
    8,
    'Consider meal prepping or limiting dining out to weekends.'
  );
  checkLeak(
    'Subscriptions',
    input.subscriptions,
    5,
    'Audit subscriptions monthly. Cancel unused services.'
  );
  checkLeak(
    'Shopping',
    input.shopping,
    10,
    'Implement a 48-hour rule before non-essential purchases.'
  );
  checkLeak(
    'Miscellaneous',
    input.miscellaneous,
    10,
    'Track where this money actually goes for a week.'
  );
  checkLeak(
    'Transport',
    input.transport,
    12,
    'Consider carpooling, public transport, or bike commuting.'
  );

  return leaks.sort((a, b) => b.percentageOfIncome - a.percentageOfIncome).slice(0, 3);
}

export function generateRiskFlags(
  normalized: NormalizedBudget,
  input: BudgetInput
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const income = normalized.income;

  if (normalized.monthlyBalance < 0) {
    flags.push({
      type: 'Negative Cash Flow',
      severity: 'danger',
      message: `You are spending ${Math.abs(normalized.monthlyBalance).toLocaleString()} more than you earn.`,
      action: 'Immediately cut non-essential expenses.',
    });
  }

  if (input.savingsInvestments / income < 0.05) {
    flags.push({
      type: 'No Emergency Buffer',
      severity: 'danger',
      message: 'Less than 5% savings leaves you vulnerable to emergencies.',
      action: 'Build a 3-month emergency fund before other goals.',
    });
  }

  if (input.debtEmi / income > 0.3) {
    flags.push({
      type: 'Debt Stress',
      severity: 'danger',
      message: 'Debt payments exceed 30% of income.',
      action: 'Explore debt consolidation or restructuring options.',
    });
  }

  if ((input.eatingOut + input.shopping) / income > 0.2) {
    flags.push({
      type: 'Lifestyle Inflation',
      severity: 'warning',
      message: 'Discretionary spending is eating into essentials.',
      action: 'Set strict weekly limits for eating out and shopping.',
    });
  }

  if (input.miscellaneous / income > 0.15) {
    flags.push({
      type: 'Tracking Gap',
      severity: 'warning',
      message: 'High untracked expenses indicate poor visibility.',
      action: 'Use an expense tracker app for 2 weeks.',
    });
  }

  if (input.rent / income > 0.35) {
    flags.push({
      type: 'Housing Cost',
      severity: 'warning',
      message: 'Rent exceeds 35% of income.',
      action: 'Consider roommates or relocating when lease ends.',
    });
  }

  return flags;
}

export function buildTriagePlan(
  leaks: SpendingLeak[],
  input: BudgetInput
): TriagePlan[] {
  const plan: TriagePlan[] = [];

  // Day 1-2: Quick wins
  plan.push({
    day: 1,
    action: 'List all active subscriptions and cancel at least one unused service',
    category: 'Subscriptions',
    expectedSaving: Math.round(input.subscriptions * 0.2),
  });

  plan.push({
    day: 2,
    action: 'Pack lunch for the rest of the week instead of ordering',
    category: 'Eating Out',
    expectedSaving: Math.round(input.eatingOut * 0.15),
  });

  // Day 3-4: Track and plan
  plan.push({
    day: 3,
    action: 'Download an expense tracker and log every purchase today',
    category: 'Tracking',
    expectedSaving: 0,
  });

  plan.push({
    day: 4,
    action: 'Review last month bank statement and categorize surprises',
    category: 'Analysis',
    expectedSaving: 0,
  });

  // Day 5-6: Address leaks
  if (leaks.length > 0) {
    plan.push({
      day: 5,
      action: `Focus on reducing ${leaks[0].category}: ${leaks[0].suggestion}`,
      category: leaks[0].category,
      expectedSaving: Math.round(leaks[0].amount * 0.2),
    });
  }

  plan.push({
    day: 6,
    action: 'Set up automatic savings transfer for next month',
    category: 'Savings',
    expectedSaving: Math.round(input.monthlyIncome * 0.05),
  });

  plan.push({
    day: 7,
    action: 'Review week progress and plan next week budget',
    category: 'Planning',
    expectedSaving: 0,
  });

  return plan;
}

export function buildRecoveryWorkflow(
  healthScore: BudgetHealthScore,
  input: BudgetInput
): RecoveryMilestone[] {
  const milestones: RecoveryMilestone[] = [];
  const monthlyTarget = Math.round(input.monthlyIncome * 0.1);

  milestones.push({
    week: 1,
    title: 'Foundation Week',
    actions: [
      'Complete 7-day triage plan',
      'Set up budget tracking system',
      'Identify top 3 expense categories to reduce',
    ],
    targetSaving: Math.round(monthlyTarget * 0.2),
  });

  milestones.push({
    week: 2,
    title: 'Cut the Obvious',
    actions: [
      'Cancel unused subscriptions',
      'Meal prep for 5 days',
      'Use public transport twice',
    ],
    targetSaving: Math.round(monthlyTarget * 0.3),
  });

  milestones.push({
    week: 3,
    title: 'Build Habits',
    actions: [
      'Implement 48-hour rule for purchases',
      'Cook at home 6 days',
      'No-spend weekend challenge',
    ],
    targetSaving: Math.round(monthlyTarget * 0.3),
  });

  milestones.push({
    week: 4,
    title: 'Lock It In',
    actions: [
      'Review progress and adjust budget',
      'Increase automatic savings by 2%',
      'Plan next month with new habits',
    ],
    targetSaving: Math.round(monthlyTarget * 0.2),
  });

  return milestones;
}

export function generateSuggestedRules(
  healthScore: BudgetHealthScore,
  input: BudgetInput
): string[] {
  const rules: string[] = [];
  const income = input.monthlyIncome;

  rules.push(`Keep total expenses under ${Math.round(income * 0.7).toLocaleString()}`);
  rules.push(`Save at least ${Math.round(income * 0.2).toLocaleString()} monthly`);
  rules.push(`Limit eating out to ${Math.round(income * 0.05).toLocaleString()}`);
  rules.push(`Cap subscriptions at ${Math.round(income * 0.03).toLocaleString()}`);
  rules.push('Review all expenses every Sunday');
  rules.push('Wait 48 hours before any purchase over 1000');

  if (input.debtEmi > 0) {
    rules.push('No new debt until current EMIs are below 15% of income');
  }

  if (healthScore.status === 'Red Zone') {
    rules.push('Freeze all discretionary spending for 2 weeks');
    rules.push('Sell unused items to boost emergency fund');
  }

  return rules;
}
