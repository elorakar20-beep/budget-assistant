'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScoreRing } from '@/components/score-ring';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  BarChart3,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { MonthlySnapshot, ScheduledReport, Expense, ExpenseCategory, BudgetSettings } from '@/lib/types';
import { CURRENCY_SYMBOLS } from '@/lib/types';

interface ReportsViewProps {
  snapshots: MonthlySnapshot[];
  reports: ScheduledReport[];
  currentExpenses: (Expense & { category: ExpenseCategory | null })[];
  settings: BudgetSettings | null;
  userId: string;
}

export function ReportsView({ snapshots, currentExpenses, settings }: ReportsViewProps) {
  const currencySymbol = CURRENCY_SYMBOLS['INR'];
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: 'manual' }),
      });
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      const data = await response.json();
      toast.success('Report generated successfully!', {
        description: `Health Score: ${data.report.health_score}/100 - ${data.report.health_status}`,
      });
      
      // Refresh the page to show new report
      window.location.reload();
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      generated_at: new Date().toISOString(),
      current_month: format(new Date(), 'MMMM yyyy'),
      income: currentStats.income,
      expenses: currentStats.totalExpenses,
      savings: currentStats.savings,
      savings_rate: `${currentStats.savingsRate.toFixed(1)}%`,
      health_score: currentStats.healthScore,
      status: currentStats.status,
      category_breakdown: categoryBreakdown,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketpilot-report-${format(new Date(), 'yyyy-MM')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  // Calculate current month stats
  const currentStats = useMemo(() => {
    const totalExpenses = currentExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const income = settings?.monthly_income || 0;
    const savings = income - totalExpenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const expenseRatio = income > 0 ? (totalExpenses / income) * 100 : 0;

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
  }, [currentExpenses, settings]);

  // Calculate comparison with previous month
  const comparison = useMemo(() => {
    if (snapshots.length === 0) return null;
    
    const prevSnapshot = snapshots[0];
    
    const expenseChange = currentStats.totalExpenses - Number(prevSnapshot.total_expenses);
    const expenseChangePercent = Number(prevSnapshot.total_expenses) > 0 
      ? (expenseChange / Number(prevSnapshot.total_expenses)) * 100 
      : 0;

    const savingsChange = currentStats.savings - Number(prevSnapshot.total_savings);
    const savingsChangePercent = Number(prevSnapshot.total_savings) > 0
      ? (savingsChange / Number(prevSnapshot.total_savings)) * 100
      : 0;

    const healthScoreChange = currentStats.healthScore - prevSnapshot.health_score;

    // Analyze reasons for changes
    const reasons: { category: string; change: number; impact: 'positive' | 'negative' | 'neutral' }[] = [];
    
    if (expenseChange > 0) {
      reasons.push({
        category: 'Overall Spending',
        change: expenseChangePercent,
        impact: 'negative',
      });
    } else if (expenseChange < 0) {
      reasons.push({
        category: 'Overall Spending',
        change: expenseChangePercent,
        impact: 'positive',
      });
    }

    return {
      prevMonth: format(parseISO(prevSnapshot.month_year), 'MMMM yyyy'),
      expenseChange,
      expenseChangePercent,
      savingsChange,
      savingsChangePercent,
      healthScoreChange,
      reasons,
    };
  }, [snapshots, currentStats]);

  // Group expenses by category for breakdown
  const categoryBreakdown = useMemo(() => {
    const grouped: Record<string, { name: string; amount: number; color: string }> = {};
    currentExpenses.forEach((exp) => {
      const catName = exp.category?.name || 'Uncategorized';
      const catColor = exp.category?.color || '#6b7280';
      if (!grouped[catName]) {
        grouped[catName] = { name: catName, amount: 0, color: catColor };
      }
      grouped[catName].amount += Number(exp.amount);
    });
    return Object.values(grouped).sort((a, b) => b.amount - a.amount);
  }, [currentExpenses]);

  const ChangeIndicator = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    if (value === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (value > 0) {
      return (
        <span className="flex items-center text-destructive text-sm">
          <ArrowUpRight className="h-4 w-4" />
          +{Math.abs(value).toFixed(1)}{suffix}
        </span>
      );
    }
    return (
      <span className="flex items-center text-success text-sm">
        <ArrowDownRight className="h-4 w-4" />
        {Math.abs(value).toFixed(1)}{suffix}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Budget analysis and monthly comparisons
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Current Month Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{format(new Date(), 'MMMM yyyy')}</CardTitle>
              <CardDescription>Current month overview</CardDescription>
            </div>
            <ScoreRing score={currentStats.healthScore} size={70} strokeWidth={6} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-xl font-semibold">{currencySymbol}{currentStats.income.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-xl font-semibold">{currencySymbol}{currentStats.totalExpenses.toLocaleString()}</p>
              {comparison && <ChangeIndicator value={comparison.expenseChangePercent} />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Savings</p>
              <p className={`text-xl font-semibold ${currentStats.savings < 0 ? 'text-destructive' : ''}`}>
                {currencySymbol}{Math.abs(currentStats.savings).toLocaleString()}
              </p>
              {comparison && <ChangeIndicator value={comparison.savingsChangePercent} />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                variant={currentStats.status === 'Stable' ? 'default' : currentStats.status === 'Needs Attention' ? 'secondary' : 'destructive'}
                className="mt-1"
              >
                {currentStats.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month-over-Month Comparison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparison vs {comparison.prevMonth}
            </CardTitle>
            <CardDescription>How your spending has changed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Expenses</span>
                  {comparison.expenseChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-destructive" />
                  ) : comparison.expenseChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-success" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                </div>
                <p className={`text-lg font-semibold ${comparison.expenseChange > 0 ? 'text-destructive' : 'text-success'}`}>
                  {comparison.expenseChange > 0 ? '+' : ''}{currencySymbol}{comparison.expenseChange.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {comparison.expenseChangePercent.toFixed(1)}% change
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Savings</span>
                  {comparison.savingsChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : comparison.savingsChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                </div>
                <p className={`text-lg font-semibold ${comparison.savingsChange > 0 ? 'text-success' : 'text-destructive'}`}>
                  {comparison.savingsChange > 0 ? '+' : ''}{currencySymbol}{comparison.savingsChange.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {comparison.savingsChangePercent.toFixed(1)}% change
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Health Score</span>
                  {comparison.healthScoreChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : comparison.healthScoreChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                </div>
                <p className={`text-lg font-semibold ${comparison.healthScoreChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {comparison.healthScoreChange > 0 ? '+' : ''}{comparison.healthScoreChange} points
                </p>
                <p className="text-sm text-muted-foreground">
                  Now at {currentStats.healthScore}/100
                </p>
              </div>
            </div>

            {/* Change Reasons */}
            {comparison.reasons.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Impact Analysis</h4>
                <div className="space-y-2">
                  {comparison.reasons.map((reason, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span className="text-sm">{reason.category}</span>
                      <Badge variant={reason.impact === 'positive' ? 'default' : reason.impact === 'negative' ? 'destructive' : 'secondary'}>
                        {reason.change > 0 ? '+' : ''}{reason.change.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending Breakdown</CardTitle>
          <CardDescription>Current month by category</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No expenses recorded this month
            </p>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {currencySymbol}{cat.amount.toLocaleString()}
                      <span className="ml-2">
                        ({((cat.amount / currentStats.totalExpenses) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <Progress 
                    value={(cat.amount / currentStats.totalExpenses) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Snapshots */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly History
            </CardTitle>
            <CardDescription>Past monthly snapshots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {format(parseISO(snapshot.month_year), 'MMM')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(snapshot.month_year), 'yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {currencySymbol}{Number(snapshot.total_expenses).toLocaleString()} spent
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currencySymbol}{Number(snapshot.total_savings).toLocaleString()} saved
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreRing score={snapshot.health_score} size={40} strokeWidth={4} />
                    <Badge 
                      variant={snapshot.health_status === 'Stable' ? 'default' : snapshot.health_status === 'Needs Attention' ? 'secondary' : 'destructive'}
                    >
                      {snapshot.health_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {snapshots.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No historical data yet</h3>
            <p className="text-muted-foreground">
              Monthly snapshots will appear here after your first scheduled report
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
