'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { BudgetForm } from '@/components/budget-form';
import { BudgetDashboard } from '@/components/budget-dashboard';
import { WorkflowProgress, WORKFLOW_STEPS, type WorkflowStepInfo } from '@/components/workflow-progress';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import type { BudgetInput, BudgetReport } from '@/lib/types';
import { Activity, LogIn, Wallet, ArrowRight, Sparkles, PiggyBank, TrendingUp, Calendar, User } from 'lucide-react';

type AppState = 'input' | 'processing' | 'results';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [report, setReport] = useState<BudgetReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepInfo[]>(WORKFLOW_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const simulateWorkflowProgress = useCallback(() => {
    const stepDurations = [400, 350, 500, 400, 350, 400, 300];
    let currentIndex = 0;

    const advanceStep = () => {
      if (currentIndex >= WORKFLOW_STEPS.length) return;

      setWorkflowSteps((prev) =>
        prev.map((step, idx) => {
          if (idx < currentIndex) return { ...step, status: 'completed' as const };
          if (idx === currentIndex) return { ...step, status: 'running' as const };
          return { ...step, status: 'pending' as const };
        })
      );
      setCurrentStepIndex(currentIndex);

      currentIndex++;
      if (currentIndex <= WORKFLOW_STEPS.length) {
        setTimeout(advanceStep, stepDurations[currentIndex - 1] || 300);
      }
    };

    advanceStep();
  }, []);

  const pollForResults = useCallback(async (id: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/analyze?runId=${id}`);
        const data = await response.json();

        if (data.status === 'completed' && data.result) {
          setWorkflowSteps((prev) =>
            prev.map((step) => ({ ...step, status: 'completed' as const }))
          );
          setReport(data.result);
          setAppState('results');
          setIsLoading(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 500);
        } else {
          throw new Error('Analysis timed out. Please try again.');
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
        setAppState('input');
      }
    };

    poll();
  }, []);

  const handleSubmit = async (data: BudgetInput) => {
    setIsLoading(true);
    setError(null);
    setAppState('processing');
    setWorkflowSteps(WORKFLOW_STEPS.map((s) => ({ ...s, status: 'pending' as const })));
    setCurrentStepIndex(0);

    // Start visual progress simulation
    simulateWorkflowProgress();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start analysis');
      }

      setRunId(result.runId);
      pollForResults(result.runId);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
      setAppState('input');
    }
  };

  const handleReset = () => {
    setAppState('input');
    setReport(null);
    setRunId(null);
    setError(null);
    setWorkflowSteps(WORKFLOW_STEPS.map((s) => ({ ...s, status: 'pending' as const })));
    setCurrentStepIndex(0);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                <Wallet className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-balance">Budget Reality Check</h1>
                <p className="text-xs text-muted-foreground">Powered by Vercel Workflow SDK</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="gap-2">
                  <span className="hidden sm:inline">Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {appState === 'input' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-balance">
                  Where Does Your Money Actually Go?
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto text-balance text-lg">
                  Get a reality check on your budget with AI-powered analysis. Find spending leaks, 
                  calculate your budget health score, and get a personalized 30-day recovery plan.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
                <div className="p-4 rounded-xl border bg-card">
                  <Sparkles className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">Get intelligent insights about your spending patterns</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <PiggyBank className="h-8 w-8 text-success mb-3" />
                  <h3 className="font-semibold mb-1">Track Daily</h3>
                  <p className="text-sm text-muted-foreground">Log expenses daily with reminders</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <TrendingUp className="h-8 w-8 text-info mb-3" />
                  <h3 className="font-semibold mb-1">Compare Months</h3>
                  <p className="text-sm text-muted-foreground">See how your spending changes over time</p>
                </div>
                <div className="p-4 rounded-xl border bg-card">
                  <Calendar className="h-8 w-8 text-warning mb-3" />
                  <h3 className="font-semibold mb-1">Scheduled Reports</h3>
                  <p className="text-sm text-muted-foreground">Get bi-monthly reports with insights</p>
                </div>
              </div>

              {/* CTA for Dashboard */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">Want to track expenses daily?</h3>
                <p className="text-muted-foreground mb-4">
                  Create an account to log daily expenses, set up categories, and receive scheduled reports.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/auth/signup">
                    <Button className="gap-2">
                      Create Free Account
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      Try as Guest
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* One-time Analysis Form */}
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Try a Quick Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  No account required. Enter your monthly budget details below.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <BudgetForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </div>
        )}

        {appState === 'processing' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Analyzing Your Budget</h2>
              <p className="text-muted-foreground text-sm">
                Running budget reality check workflow...
              </p>
            </div>

            <WorkflowProgress
              steps={workflowSteps}
              currentStep={WORKFLOW_STEPS[currentStepIndex]?.id || null}
            />
          </div>
        )}

        {appState === 'results' && report && (
          <div className="max-w-4xl mx-auto space-y-6">
            <BudgetDashboard report={report} onReset={handleReset} />
            
            {/* CTA after results */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Like what you see?</h3>
              <p className="text-muted-foreground mb-4">
                Create an account to track your expenses daily, get scheduled reports, and see how your budget improves over time.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/auth/signup">
                  <Button className="gap-2">
                    Start Tracking Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    Try as Guest
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>
            Built for the <strong>Vercel Zero to Agent Hackathon</strong> | Workflow/WDK Track
          </p>
          <p className="mt-1">
            This tool is not financial, investment, tax, or legal advice.
          </p>
        </div>
      </footer>
    </main>
  );
}
