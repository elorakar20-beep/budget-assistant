'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGuest } from '@/lib/guest-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/score-ring';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Download,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export default function GuestReportsPage() {
  const { guestData } = useGuest();
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current month, 1 = last month, etc.

  if (!guestData) return null;

  const { settings, expenses, categories } = guestData;
  const monthlyIncome = settings.monthly_income || 0;

  // Get months data
  const months = [0, 1, 2].map((offset) => {
    const date = subMonths(new Date(), offset);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const monthExpenses = expenses.filter((e) =>
      isWithinInterval(parseISO(e.expense_date), { start, end })
    );
    
    const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const savings = monthlyIncome - total;
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
    
    // Calculate health score
    const expenseRatio = monthlyIncome > 0 ? (total / monthlyIncome) * 100 : 0;
    let healthScore = 100;
    if (expenseRatio > 100) healthScore -= 40;
    else if (expenseRatio > 80) healthScore -= 20;
    else if (expenseRatio > 60) healthScore -= 10;
    if (savingsRate < 10) healthScore -= 20;
    else if (savingsRate < 20) healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Group by category
    const byCategory = monthExpenses.reduce((acc, expense) => {
      const catId = expense.category_id || 'uncategorized';
      acc[catId] = (acc[catId] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      label: format(date, 'MMMM yyyy'),
      shortLabel: format(date, 'MMM'),
      total,
      savings,
      savingsRate,
      healthScore,
      expenseCount: monthExpenses.length,
      byCategory,
    };
  });

  const currentData = months[selectedMonth];
  const previousData = months[selectedMonth + 1];

  // Calculate changes
  const expenseChange = previousData 
    ? ((currentData.total - previousData.total) / (previousData.total || 1)) * 100 
    : 0;
  const savingsChange = previousData
    ? currentData.savingsRate - previousData.savingsRate
    : 0;
  const scoreChange = previousData
    ? currentData.healthScore - previousData.healthScore
    : 0;

  // Top categories for current month
  const topCategories = Object.entries(currentData.byCategory)
    .map(([catId, amount]) => ({
      category: categories.find((c) => c.id === catId) || { name: 'Uncategorized', color: '#6b7280' },
      amount,
      percentage: currentData.total > 0 ? (amount / currentData.total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const handleExport = () => {
    const report = {
      period: currentData.label,
      income: monthlyIncome,
      totalExpenses: currentData.total,
      savings: currentData.savings,
      savingsRate: currentData.savingsRate.toFixed(1) + '%',
      healthScore: currentData.healthScore,
      expenseCount: currentData.expenseCount,
      topCategories: topCategories.map((t) => ({
        name: t.category.name,
        amount: t.amount,
        percentage: t.percentage.toFixed(1) + '%',
      })),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${format(new Date(), 'yyyy-MM')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analyze your spending patterns</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2">
        {months.map((month, i) => (
          <Button
            key={i}
            variant={selectedMonth === i ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMonth(i)}
          >
            {month.shortLabel}
          </Button>
        ))}
      </div>

      {/* Main Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${currentData.total.toLocaleString()}</p>
              </div>
              {previousData && (
                <Badge variant={expenseChange <= 0 ? 'default' : 'destructive'} className="gap-1">
                  {expenseChange <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {Math.abs(expenseChange).toFixed(0)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Savings Rate</p>
                <p className={`text-2xl font-bold ${currentData.savingsRate < 0 ? 'text-destructive' : ''}`}>
                  {currentData.savingsRate.toFixed(1)}%
                </p>
              </div>
              {previousData && (
                <Badge variant={savingsChange >= 0 ? 'default' : 'destructive'} className="gap-1">
                  {savingsChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(savingsChange).toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{currentData.healthScore}/100</p>
              </div>
              {previousData && (
                <Badge variant={scoreChange >= 0 ? 'default' : 'destructive'} className="gap-1">
                  {scoreChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(scoreChange)} pts
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <div className="space-y-3">
                {topCategories.map(({ category, amount, percentage }) => (
                  <div key={category.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <span className="font-medium">${amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: category.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No expenses this month</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Month Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {months.slice(0, 3).map((month, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{month.shortLabel}</span>
                    <span className="font-medium">${month.total.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{ 
                        width: `${Math.min(100, (month.total / (monthlyIncome || month.total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {monthlyIncome === 0 && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mt-4">
                <AlertTriangle className="h-4 w-4" />
                <span>Set your income in Settings for accurate comparisons</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <h3 className="font-semibold">Want more insights?</h3>
              <p className="text-sm text-muted-foreground">
                Create an account to get email reports, historical comparisons, and AI-powered analysis
              </p>
            </div>
            <Link href="/auth/signup">
              <Button>Create Account</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
