'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGuest } from '@/lib/guest-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/score-ring';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus,
  ArrowRight,
  Wallet,
  PiggyBank,
  Receipt,
  Lightbulb,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { USER_TYPE_LABELS, USER_TYPE_SAVINGS_TIPS, type UserType } from '@/lib/types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export function GuestDashboard() {
  const router = useRouter();
  const { guestData, isSetupComplete } = useGuest();

  // Redirect to setup if income is not set
  useEffect(() => {
    if (guestData && !isSetupComplete && guestData.settings.monthly_income === 0) {
      router.push('/guest/setup');
    }
  }, [guestData, isSetupComplete, router]);

  if (!guestData) return null;
  
  // Show loading while checking setup status
  if (!isSetupComplete && guestData.settings.monthly_income === 0) {
    return null;
  }

  const { profile, settings, expenses, categories } = guestData;
  const monthlyIncome = settings.monthly_income || 0;

  // Calculate current month expenses
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const currentMonthExpenses = expenses.filter((e) =>
    isWithinInterval(new Date(e.expense_date), { start: monthStart, end: monthEnd })
  );
  
  const totalExpenses = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const savings = monthlyIncome - totalExpenses;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
  const expenseRatio = monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0;

  // Calculate health score
  let healthScore = 100;
  if (expenseRatio > 100) healthScore -= 40;
  else if (expenseRatio > 80) healthScore -= 20;
  else if (expenseRatio > 60) healthScore -= 10;
  
  if (savingsRate < 10) healthScore -= 20;
  else if (savingsRate < 20) healthScore -= 10;
  
  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthStatus = healthScore >= 70 ? 'Stable' : healthScore >= 40 ? 'Needs Attention' : 'Critical';

  // Group expenses by category
  const expensesByCategory = currentMonthExpenses.reduce((acc, expense) => {
    const catId = expense.category_id || 'uncategorized';
    acc[catId] = (acc[catId] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(expensesByCategory)
    .map(([catId, amount]) => ({
      category: categories.find((c) => c.id === catId) || { name: 'Uncategorized', color: '#6b7280' },
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const userType = profile.user_type as UserType | null;
  const tips = userType ? USER_TYPE_SAVINGS_TIPS[userType] : null;

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      {/* Guest Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-medium text-amber-600 dark:text-amber-400">You&apos;re using Guest Mode</p>
          <p className="text-sm text-muted-foreground">Data is stored locally. Create an account to sync and get reports.</p>
        </div>
        <Link href="/auth/signup">
          <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
            Create Account
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hello, {profile.full_name || 'Guest'}
          </h1>
          <p className="text-muted-foreground">
            {format(now, 'MMMM yyyy')} Budget Overview
          </p>
        </div>
        {userType && (
          <Badge variant="secondary" className="text-sm">
            {USER_TYPE_LABELS[userType]}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-xl font-bold">${monthlyIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-xl font-bold">${totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <PiggyBank className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saved</p>
                <p className={`text-xl font-bold ${savings < 0 ? 'text-destructive' : ''}`}>
                  ${Math.abs(savings).toLocaleString()}
                  {savings < 0 && <span className="text-sm ml-1">over</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {savingsRate >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className={`text-xl font-bold ${savingsRate < 0 ? 'text-destructive' : savingsRate >= 20 ? 'text-green-500' : ''}`}>
                  {savingsRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Health Score */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Health</CardTitle>
            <CardDescription>Your financial wellness score</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ScoreRing score={healthScore} size={160} />
            <Badge 
              variant={healthStatus === 'Stable' ? 'default' : healthStatus === 'Needs Attention' ? 'secondary' : 'destructive'}
            >
              {healthStatus}
            </Badge>
            {monthlyIncome === 0 && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Set your income in Settings for accurate analysis</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Spending Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Spending</CardTitle>
            <CardDescription>Where your money is going this month</CardDescription>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <div className="space-y-3">
                {topCategories.map(({ category, amount }) => (
                  <div key={category.name} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1 text-sm">{category.name}</span>
                    <span className="font-medium">${amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No expenses recorded yet</p>
                <Link href="/guest/expenses/add">
                  <Button size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Expense
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personalized Tips */}
      {tips && userType && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                Tips for {USER_TYPE_LABELS[userType]}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tips.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
              Recommended savings goal: <strong className="text-foreground">{tips.savingsGoal}%</strong> of income
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="hidden md:flex gap-4 justify-center">
        <Link href="/guest/expenses/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
        <Link href="/guest/reports">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Reports
          </Button>
        </Link>
      </div>
    </div>
  );
}
