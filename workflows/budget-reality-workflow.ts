import type {
  BudgetInput,
  NormalizedBudget,
  CategorizedExpenses,
  BudgetHealthScore,
  SpendingLeak,
  RiskFlag,
  TriagePlan,
  RecoveryMilestone,
  BudgetReport,
} from '@/lib/types';
import {
  normalizeBudgetInput,
  categorizeExpenses,
  calculateBudgetHealthScore,
  detectSpendingLeaks,
  generateRiskFlags,
  buildTriagePlan,
  buildRecoveryWorkflow,
  generateSuggestedRules,
} from '@/lib/budget-utils';
import { generateText } from 'ai';

// Step functions - these have full Node.js access
async function normalizeBudgetStep(input: BudgetInput): Promise<NormalizedBudget> {
  'use step';
  console.log('[Workflow] Step 1: Normalizing budget input...');
  await new Promise((resolve) => setTimeout(resolve, 300));
  return normalizeBudgetInput(input);
}

async function categorizeExpensesStep(input: BudgetInput): Promise<CategorizedExpenses> {
  'use step';
  console.log('[Workflow] Step 2: Categorizing expenses...');
  await new Promise((resolve) => setTimeout(resolve, 250));
  return categorizeExpenses(input);
}

async function calculateScoreStep(
  normalized: NormalizedBudget,
  input: BudgetInput
): Promise<BudgetHealthScore> {
  'use step';
  console.log('[Workflow] Step 3: Calculating budget health score...');
  await new Promise((resolve) => setTimeout(resolve, 400));
  return calculateBudgetHealthScore(normalized, input);
}

async function detectLeaksStep(
  normalized: NormalizedBudget,
  input: BudgetInput
): Promise<SpendingLeak[]> {
  'use step';
  console.log('[Workflow] Step 4: Detecting spending leaks...');
  await new Promise((resolve) => setTimeout(resolve, 350));
  return detectSpendingLeaks(normalized, input);
}

async function generateRiskFlagsStep(
  normalized: NormalizedBudget,
  input: BudgetInput
): Promise<RiskFlag[]> {
  'use step';
  console.log('[Workflow] Step 4b: Generating risk flags...');
  await new Promise((resolve) => setTimeout(resolve, 200));
  return generateRiskFlags(normalized, input);
}

async function generateTriageStep(
  leaks: SpendingLeak[],
  input: BudgetInput
): Promise<TriagePlan[]> {
  'use step';
  console.log('[Workflow] Step 5: Generating 7-day triage plan...');
  await new Promise((resolve) => setTimeout(resolve, 300));
  return buildTriagePlan(leaks, input);
}

async function generateRecoveryStep(
  healthScore: BudgetHealthScore,
  input: BudgetInput
): Promise<RecoveryMilestone[]> {
  'use step';
  console.log('[Workflow] Step 6: Generating 30-day recovery workflow...');
  await new Promise((resolve) => setTimeout(resolve, 350));
  return buildRecoveryWorkflow(healthScore, input);
}

async function generateRulesStep(
  healthScore: BudgetHealthScore,
  input: BudgetInput
): Promise<string[]> {
  'use step';
  console.log('[Workflow] Step 6b: Generating suggested rules...');
  await new Promise((resolve) => setTimeout(resolve, 200));
  return generateSuggestedRules(healthScore, input);
}

async function generateSummaryStep(
  healthScore: BudgetHealthScore,
  leaks: SpendingLeak[],
  normalizedBudget: NormalizedBudget,
  input: BudgetInput
): Promise<string> {
  'use step';
  console.log('[Workflow] Step 7: Generating AI-powered summary...');

  const { tone, financialGoal, notes } = input;
  const { score, status } = healthScore;

  const toneInstructions = {
    gentle: 'Be supportive, encouraging, and kind. Use positive framing.',
    direct: 'Be clear, factual, and straightforward. No fluff, just the reality.',
    spicy: 'Be witty, slightly sarcastic, and memorable. Think financial reality coach with personality.',
  };

  const goalLabels: Record<string, string> = {
    save_more: 'Save More',
    pay_debt: 'Pay Off Debt',
    stop_overspending: 'Stop Overspending',
    build_emergency_fund: 'Build Emergency Fund',
    prepare_big_purchase: 'Prepare for Big Purchase',
    understand_spending: 'Understand Spending',
  };

  const prompt = `You are a budget reality coach. Generate a personalized 2-3 sentence summary for someone's budget analysis.

Budget Health Score: ${score}/100 (${status})
Monthly Income: ${normalizedBudget.income}
Total Expenses: ${normalizedBudget.totalExpenses}
Monthly Balance: ${normalizedBudget.monthlyBalance}
Expense Ratio: ${(normalizedBudget.expenseRatio * 100).toFixed(1)}%
Financial Goal: ${goalLabels[financialGoal] || financialGoal}
${leaks.length > 0 ? `Top Spending Leak: ${leaks[0].category} at ${leaks[0].percentageOfIncome.toFixed(1)}% of income` : 'No major spending leaks detected'}
${notes ? `User Notes: ${notes}` : ''}

Tone: ${toneInstructions[tone]}

Important:
- Keep it under 3 sentences
- Reference specific numbers from their budget
- End with an actionable insight related to their goal
- Do NOT give financial advice, just observations and encouragement
- Be ${tone}`;

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      maxOutputTokens: 150,
    });

    return result.text || generateFallbackSummary(healthScore, leaks, input);
  } catch (error) {
    console.error('[Workflow] AI summary generation failed, using fallback:', error);
    return generateFallbackSummary(healthScore, leaks, input);
  }
}

function generateFallbackSummary(
  healthScore: BudgetHealthScore,
  leaks: SpendingLeak[],
  input: BudgetInput
): string {
  const { tone, financialGoal } = input;
  const { score, status } = healthScore;

  let opening = '';
  let analysis = '';
  let closing = '';

  // Tone-based opening
  if (tone === 'gentle') {
    if (status === 'Stable') {
      opening = "Great job! You're doing well with your finances.";
    } else if (status === 'Needs Attention') {
      opening = "There's room for improvement, but you're on the right track.";
    } else {
      opening = "Let's work together to get your budget back on track.";
    }
  } else if (tone === 'direct') {
    if (status === 'Stable') {
      opening = `Your budget health score is ${score}/100. Solid foundation.`;
    } else if (status === 'Needs Attention') {
      opening = `Score: ${score}/100. Several areas need immediate focus.`;
    } else {
      opening = `Score: ${score}/100. This requires urgent action.`;
    }
  } else {
    if (status === 'Stable') {
      opening = `${score}/100 - Not bad! But don't get comfortable.`;
    } else if (status === 'Needs Attention') {
      opening = `${score}/100 - Your wallet is sending distress signals.`;
    } else {
      opening = `${score}/100 - Houston, we have a budget problem.`;
    }
  }

  if (leaks.length > 0) {
    const topLeak = leaks[0];
    if (tone === 'spicy') {
      analysis = `Your ${topLeak.category.toLowerCase()} spending is ${topLeak.percentageOfIncome.toFixed(1)}% of income. That's where your money is quietly escaping.`;
    } else {
      analysis = `${topLeak.category} at ${topLeak.percentageOfIncome.toFixed(1)}% of income is your biggest opportunity for improvement.`;
    }
  } else {
    analysis = 'No major spending leaks detected. Focus on building savings.';
  }

  const goalClosings: Record<string, string> = {
    save_more: 'Follow the 30-day plan to boost your savings rate.',
    pay_debt: 'Prioritize debt payments with the freed-up funds.',
    stop_overspending: 'Use the triage plan to break overspending habits.',
    build_emergency_fund: 'Redirect savings to build your emergency buffer.',
    prepare_big_purchase: 'This plan will help you save for your goal.',
    understand_spending: 'Track expenses for 2 weeks using the suggested tools.',
  };
  closing = goalClosings[financialGoal] || 'Follow the action plan to improve your financial health.';

  return `${opening} ${analysis} ${closing}`;
}

async function compileReportStep(
  normalizedBudget: NormalizedBudget,
  categorizedExpenses: CategorizedExpenses,
  healthScore: BudgetHealthScore,
  spendingLeaks: SpendingLeak[],
  riskFlags: RiskFlag[],
  triagePlan: TriagePlan[],
  recoveryWorkflow: RecoveryMilestone[],
  suggestedRules: string[],
  summary: string,
  input: BudgetInput
): Promise<BudgetReport> {
  'use step';
  console.log('[Workflow] Compiling final report...');
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    normalizedBudget,
    categorizedExpenses,
    healthScore,
    spendingLeaks,
    riskFlags,
    triagePlan,
    recoveryWorkflow,
    suggestedRules,
    summary,
    input,
    generatedAt: new Date().toISOString(),
  };
}

// Main workflow function - orchestrates all steps
export async function budgetRealityWorkflow(input: BudgetInput): Promise<BudgetReport> {
  'use workflow';

  // Step 1: Normalize input
  const normalizedBudget = await normalizeBudgetStep(input);

  // Step 2: Categorize expenses
  const categorizedExpenses = await categorizeExpensesStep(input);

  // Step 3: Calculate health score
  const healthScore = await calculateScoreStep(normalizedBudget, input);

  // Step 4: Detect leaks and risk flags
  const spendingLeaks = await detectLeaksStep(normalizedBudget, input);
  const riskFlags = await generateRiskFlagsStep(normalizedBudget, input);

  // Step 5: Generate triage plan
  const triagePlan = await generateTriageStep(spendingLeaks, input);

  // Step 6: Generate recovery workflow and rules
  const recoveryWorkflow = await generateRecoveryStep(healthScore, input);
  const suggestedRules = await generateRulesStep(healthScore, input);

  // Step 7: Generate AI-powered summary
  const summary = await generateSummaryStep(healthScore, spendingLeaks, normalizedBudget, input);

  // Compile final report
  const report = await compileReportStep(
    normalizedBudget,
    categorizedExpenses,
    healthScore,
    spendingLeaks,
    riskFlags,
    triagePlan,
    recoveryWorkflow,
    suggestedRules,
    summary,
    input
  );

  console.log('[Workflow] Budget reality check complete!');
  return report;
}
