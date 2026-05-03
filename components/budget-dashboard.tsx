'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScoreRing } from '@/components/score-ring';
import { cn } from '@/lib/utils';
import {
  type BudgetReport,
  CURRENCY_SYMBOLS,
} from '@/lib/types';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Download,
  TrendingDown,
  Calendar,
  Target,
  Shield,
  Flame,
} from 'lucide-react';
import { useState } from 'react';

interface BudgetDashboardProps {
  report: BudgetReport;
  onReset: () => void;
}

export function BudgetDashboard({ report, onReset }: BudgetDashboardProps) {
  const [copied, setCopied] = useState(false);
  const currency = CURRENCY_SYMBOLS[report.normalizedBudget.currency];

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateMarkdown = () => {
    const { healthScore, normalizedBudget, spendingLeaks, triagePlan, recoveryWorkflow, suggestedRules, summary } = report;
    
    let md = `# Budget Reality Check Report\n\n`;
    md += `**Generated:** ${new Date(report.generatedAt).toLocaleDateString()}\n\n`;
    md += `## Summary\n\n${summary}\n\n`;
    md += `## Health Score: ${healthScore.score}/100 (${healthScore.status})\n\n`;
    md += `### Income vs Expenses\n`;
    md += `- Monthly Income: ${formatCurrency(normalizedBudget.income)}\n`;
    md += `- Total Expenses: ${formatCurrency(normalizedBudget.totalExpenses)}\n`;
    md += `- Monthly Balance: ${formatCurrency(normalizedBudget.monthlyBalance)}\n\n`;
    
    if (spendingLeaks.length > 0) {
      md += `## Top Spending Leaks\n\n`;
      spendingLeaks.forEach((leak, i) => {
        md += `${i + 1}. **${leak.category}**: ${formatCurrency(leak.amount)} (${leak.percentageOfIncome.toFixed(1)}% of income)\n`;
        md += `   - ${leak.suggestion}\n`;
      });
      md += '\n';
    }
    
    md += `## 7-Day Triage Plan\n\n`;
    triagePlan.forEach((item) => {
      md += `- **Day ${item.day}**: ${item.action}\n`;
    });
    md += '\n';
    
    md += `## 30-Day Recovery Workflow\n\n`;
    recoveryWorkflow.forEach((milestone) => {
      md += `### Week ${milestone.week}: ${milestone.title}\n`;
      milestone.actions.forEach((action) => {
        md += `- ${action}\n`;
      });
      md += `- Target Saving: ${formatCurrency(milestone.targetSaving)}\n\n`;
    });
    
    md += `## Suggested Rules\n\n`;
    suggestedRules.forEach((rule) => {
      md += `- ${rule}\n`;
    });
    
    return md;
  };

  const handleCopyMarkdown = async () => {
    const md = generateMarkdown();
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { healthScore, normalizedBudget, categorizedExpenses, spendingLeaks, riskFlags, triagePlan, recoveryWorkflow, suggestedRules, summary } = report;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    healthScore.status === 'Stable'
                      ? 'default'
                      : healthScore.status === 'Needs Attention'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="text-sm px-3 py-1"
                >
                  {healthScore.status}
                </Badge>
                <span className="text-sm text-muted-foreground">Budget Health</span>
              </div>
              <p className="text-center md:text-left text-foreground/90 max-w-md">{summary}</p>
            </div>
            <ScoreRing score={healthScore.score} status={healthScore.status} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-success/10">
                <ArrowUp className="size-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-xl font-semibold">{formatCurrency(normalizedBudget.income)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <ArrowDown className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-semibold">{formatCurrency(normalizedBudget.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex size-10 items-center justify-center rounded-full",
                normalizedBudget.monthlyBalance >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                {normalizedBudget.monthlyBalance >= 0 ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <AlertTriangle className="size-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Balance</p>
                <p className={cn(
                  "text-xl font-semibold",
                  normalizedBudget.monthlyBalance >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(normalizedBudget.monthlyBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-info/10">
                <Shield className="size-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Savings</p>
                <p className="text-xl font-semibold">{formatCurrency(categorizedExpenses.savings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed vs Flexible Expenses */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              Fixed Expenses
            </CardTitle>
            <CardDescription>
              {formatCurrency(categorizedExpenses.fixed.total)} ({((categorizedExpenses.fixed.total / normalizedBudget.income) * 100).toFixed(1)}% of income)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(categorizedExpenses.fixed.items).map(([key, value]) => (
              value > 0 && (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{formatCurrency(value)}</span>
                  </div>
                  <Progress value={(value / normalizedBudget.income) * 100} className="h-2" />
                </div>
              )
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="size-4 text-muted-foreground" />
              Flexible Expenses
            </CardTitle>
            <CardDescription>
              {formatCurrency(categorizedExpenses.flexible.total)} ({((categorizedExpenses.flexible.total / normalizedBudget.income) * 100).toFixed(1)}% of income)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(categorizedExpenses.flexible.items).map(([key, value]) => (
              value > 0 && (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{formatCurrency(value)}</span>
                  </div>
                  <Progress value={(value / normalizedBudget.income) * 100} className="h-2" />
                </div>
              )
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Spending Leaks */}
      {spendingLeaks.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="size-4 text-warning" />
              Top Spending Leaks
            </CardTitle>
            <CardDescription>Where your money is quietly escaping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {spendingLeaks.map((leak, index) => (
              <div
                key={leak.category}
                className="flex flex-col gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-warning/20 text-xs font-medium text-warning">
                      {index + 1}
                    </span>
                    <span className="font-medium">{leak.category}</span>
                  </div>
                  <Badge
                    variant={
                      leak.severity === 'high'
                        ? 'destructive'
                        : leak.severity === 'medium'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {leak.severity}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(leak.amount)} ({leak.percentageOfIncome.toFixed(1)}% of income)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{leak.suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              Risk Flags
            </CardTitle>
            <CardDescription>Issues that need attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskFlags.map((flag, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border",
                  flag.severity === 'danger'
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-warning/5 border-warning/20"
                )}
              >
                <div className="flex items-start gap-2">
                  <Badge variant={flag.severity === 'danger' ? 'destructive' : 'secondary'}>
                    {flag.type}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">{flag.message}</p>
                <p className="mt-1 text-sm text-muted-foreground">Action: {flag.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Score Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Breakdown</CardTitle>
          <CardDescription>What affects your budget health score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {healthScore.factors.map((factor, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30"
            >
              <div>
                <p className="font-medium">{factor.name}</p>
                <p className="text-sm text-muted-foreground">{factor.description}</p>
              </div>
              <Badge
                variant={factor.impact > 0 ? 'default' : factor.impact < 0 ? 'destructive' : 'secondary'}
                className="shrink-0"
              >
                {factor.impact > 0 ? '+' : ''}{factor.impact}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 7-Day Triage Plan */}
      <Card className="border-info/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-4 text-info" />
            7-Day Triage Plan
          </CardTitle>
          <CardDescription>Quick wins to start improving your budget</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {triagePlan.map((item) => (
                <div key={item.day} className="relative pl-8">
                  <div className="absolute left-0 flex size-6 items-center justify-center rounded-full bg-info text-info-foreground text-xs font-medium">
                    {item.day}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{item.action}</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      {item.expectedSaving > 0 && (
                        <span>Expected saving: {formatCurrency(item.expectedSaving)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Recovery Workflow */}
      <Card className="border-success/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="size-4 text-success" />
            30-Day Recovery Workflow
          </CardTitle>
          <CardDescription>Build lasting habits over the next month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {recoveryWorkflow.map((milestone) => (
            <div key={milestone.week} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Week {milestone.week}: {milestone.title}</h4>
                <Badge variant="outline">Target: {formatCurrency(milestone.targetSaving)}</Badge>
              </div>
              <ul className="space-y-2 pl-4">
                {milestone.actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggested Rules for Next Month</CardTitle>
          <CardDescription>Guidelines to maintain budget health</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {suggestedRules.map((rule, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                  {index + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Your Report</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleDownloadJSON}>
            <Download className="size-4" />
            Download JSON
          </Button>
          <Button variant="outline" onClick={handleCopyMarkdown}>
            <Copy className="size-4" />
            {copied ? 'Copied!' : 'Copy Markdown'}
          </Button>
          <Button onClick={onReset}>
            Run New Analysis
          </Button>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Disclaimer:</strong> This tool is for educational and informational purposes only. 
            It is not financial, investment, tax, or legal advice. Always consult qualified professionals 
            for financial decisions. The Budget Reality Check Agent helps organize spending and identify 
            patterns but does not guarantee any specific financial outcomes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
