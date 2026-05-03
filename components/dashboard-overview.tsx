'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreRing } from '@/components/score-ring';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Plus,
  ArrowRight,
  Wallet,
  PiggyBank,
  Receipt,
  Target,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { BudgetSettings, Expense, ExpenseCategory, MonthlySnapshot, Profile, UserType } from '@/lib/types';
import { CURRENCY_SYMBOLS, USER_TYPE_LABELS, USER_TYPE_SAVINGS_TIPS } from '@/lib/types';
import { format } from 'date-fns';

interface DashboardOverviewProps {
  user: User;
  settings: BudgetSettings | null;
  expenses: (Expense & { category: ExpenseCategory | null })[];
  categories: ExpenseCategory[];
  snapshots: MonthlySnapshot[];
  profile: Profile | null;
}

export function DashboardOverview({
  settings,
  expenses,
  categories,
  snapshots,
  profile,
}: DashboardOverviewProps) {
  const currency = 'INR'; // Default, could come from settings
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Calculate this month's totals
  const monthlyStats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const income = settings?.monthly_income || 0;
    const savings = income - totalExpenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const expenseRatio = income > 0 ? (totalExpenses / income) * 100 : 0;

    // Calculate health score (simplified)
    let healthScore = 100;
    if (expenseRatio > 90) healthScore -= 40;
    else if (expenseRatio > 80) healthScore -= 25;
    else if (expenseRatio > 70) healthScore -= 10;
    if (savingsRate < 10) healthScore -= 20;
    else if (savingsRate < 20) healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const status = healthScore >= 70 ? 'Stable' : healthScore >= 40 ? 'Needs Attention' : 'Red Zone';

    return {
      totalExpenses,
      income,
      savings,
      savingsRate,
      expenseRatio,
      healthScore,
      status,
    };
  }, [expenses, settings]);

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, { name: string; amount: number; color: string }> = {};
    expenses.forEach((exp) => {
      const catName = exp.category?.name || 'Uncategorized';
      const catColor = exp.category?.color || '#6b7280';
      if (!grouped[catName]) {
        grouped[catName] = { name: catName, amount: 0, color: catColor };
      }
      grouped[catName].amount += Number(exp.amount);
    });
    return Object.values(grouped).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Get recent expenses
  const recentExpenses = expenses.slice(0, 5);

  // Compare with previous month
  const previousSnapshot = snapshots[1];
  const comparison = useMemo(() => {
    if (!previousSnapshot) return null;
    
    const expenseChange = monthlyStats.totalExpenses - Number(previousSnapshot.total_expenses);
    const expenseChangePercent = Number(previousSnapshot.total_expenses) > 0 
      ? (expenseChange / Number(previousSnapshot.total_expenses)) * 100 
      : 0;
    
    return {
      expenseChange,
      expenseChangePercent,
      healthScoreChange: monthlyStats.healthScore - previousSnapshot.health_score,
    };
  }, [monthlyStats, previousSnapshot]);

  // Check for alerts
  const alerts = useMemo(() => {
    const alertList: { type: 'warning' | 'danger'; message: string }[] = [];
    
    if (monthlyStats.expenseRatio > 90) {
      alertList.push({ type: 'danger', message: 'You have spent over 90% of your income!' });
    } else if (monthlyStats.expenseRatio > 80) {
      alertList.push({ type: 'warning', message: 'You have spent over 80% of your income' });
    }
    
    if (monthlyStats.savingsRate < 10 && settings?.savings_goal_percent && settings.savings_goal_percent > 10) {
      alertList.push({ type: 'warning', message: `Savings rate (${monthlyStats.savingsRate.toFixed(1)}%) is below your goal (${settings.savings_goal_percent}%)` });
    }

    // Check category budget limits
    expensesByCategory.forEach((cat) => {
      const category = categories.find((c) => c.name === cat.name);
      if (category?.budget_limit && cat.amount > Number(category.budget_limit)) {
        alertList.push({ type: 'warning', message: `${cat.name} spending exceeds budget limit` });
      }
    });

    return alertList;
  }, [monthlyStats, expensesByCategory, categories, settings]);

  // Show setup prompt if no settings
  if (!settings) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Welcome to PocketPilot!</CardTitle>
            <CardDescription>
              Let&apos;s set up your budget to start tracking your finances
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/dashboard/settings">
              <Button size="lg" className="gap-2">
                Set Up Your Budget
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div 
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                alert.type === 'danger' 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                  : 'bg-warning/10 text-warning-foreground border border-warning/20'
              }`}
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-lg font-semibold">
                  {currencySymbol}{monthlyStats.income.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-lg font-semibold">
                  {currencySymbol}{monthlyStats.totalExpenses.toLocaleString()}
                </p>
                {comparison && (
                  <div className={`flex items-center gap-1 text-xs ${comparison.expenseChange > 0 ? 'text-destructive' : 'text-success'}`}>
                    {comparison.expenseChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(comparison.expenseChangePercent).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Savings</p>
                <p className={`text-lg font-semibold ${monthlyStats.savings < 0 ? 'text-destructive' : ''}`}>
                  {currencySymbol}{Math.abs(monthlyStats.savings).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {monthlyStats.savingsRate.toFixed(1)}% rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <ScoreRing 
                score={monthlyStats.healthScore} 
                size={60} 
                strokeWidth={6}
              />
              <Badge 
                variant={monthlyStats.status === 'Stable' ? 'default' : monthlyStats.status === 'Needs Attention' ? 'secondary' : 'destructive'}
                className="mt-2"
              >
                {monthlyStats.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Monthly Budget Used</span>
            <span className="text-sm text-muted-foreground">
              {monthlyStats.expenseRatio.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(100, monthlyStats.expenseRatio)} 
            className={monthlyStats.expenseRatio > 90 ? '[&>div]:bg-destructive' : monthlyStats.expenseRatio > 70 ? '[&>div]:bg-warning' : ''}
          />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Spending by Category</CardTitle>
              <Link href="/dashboard/categories">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {expensesByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expenses recorded yet
              </p>
            ) : (
              expensesByCategory.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {currencySymbol}{cat.amount.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={(cat.amount / monthlyStats.totalExpenses) * 100} 
                      className="h-1.5 mt-1"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Expenses</CardTitle>
              <Link href="/dashboard/expenses">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  No expenses recorded yet
                </p>
                <Link href="/dashboard/expenses/add">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${expense.category?.color || '#6b7280'}20` }}
                      >
                        <Receipt className="h-4 w-4" style={{ color: expense.category?.color || '#6b7280' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {expense.description || expense.category?.name || 'Expense'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.expense_date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {currencySymbol}{Number(expense.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personalized Tips based on User Type */}
      {profile?.user_type && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                Tips for {USER_TYPE_LABELS[profile.user_type as UserType] || 'You'}
              </CardTitle>
            </div>
            <CardDescription>
              Personalized advice based on your financial profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {USER_TYPE_SAVINGS_TIPS[profile.user_type as UserType]?.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            {USER_TYPE_SAVINGS_TIPS[profile.user_type as UserType] && (
              <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                Recommended savings goal: <strong className="text-foreground">{USER_TYPE_SAVINGS_TIPS[profile.user_type as UserType].savingsGoal}%</strong> of income
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Desktop */}
      <div className="hidden md:flex gap-4 justify-center">
        <Link href="/dashboard/expenses/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
        <Link href="/dashboard/reports">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Reports
          </Button>
        </Link>
      </div>
    </div>
  );
}
