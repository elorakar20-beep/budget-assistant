'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

export interface WorkflowStepInfo {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

interface WorkflowProgressProps {
  steps: WorkflowStepInfo[];
  currentStep: string | null;
}

const WORKFLOW_STEPS: WorkflowStepInfo[] = [
  { id: 'normalize', name: 'Normalizing Budget Input', status: 'pending' },
  { id: 'categorize', name: 'Categorizing Expenses', status: 'pending' },
  { id: 'score', name: 'Calculating Health Score', status: 'pending' },
  { id: 'leaks', name: 'Detecting Spending Leaks', status: 'pending' },
  { id: 'triage', name: 'Generating 7-Day Triage Plan', status: 'pending' },
  { id: 'recovery', name: 'Building 30-Day Recovery Workflow', status: 'pending' },
  { id: 'report', name: 'Compiling Final Report', status: 'pending' },
];

export function WorkflowProgress({ steps, currentStep }: WorkflowProgressProps) {
  const displaySteps = steps.length > 0 ? steps : WORKFLOW_STEPS;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-primary" />
          </span>
          Workflow Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

          <div className="space-y-3">
            {displaySteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'relative flex items-center gap-3 pl-8',
                  step.status === 'completed' && 'text-muted-foreground',
                  step.status === 'running' && 'text-primary font-medium'
                )}
              >
                {/* Step indicator */}
                <div className="absolute left-0 flex items-center justify-center size-6 rounded-full bg-background">
                  {step.status === 'completed' && (
                    <CheckCircle2 className="size-5 text-success" />
                  )}
                  {step.status === 'running' && (
                    <Loader2 className="size-5 text-primary animate-spin" />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className="size-5 text-destructive" />
                  )}
                  {step.status === 'pending' && (
                    <Circle className="size-5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Step name */}
                <span className="text-sm">
                  {step.name}
                  {step.status === 'running' && (
                    <span className="ml-2 text-xs text-muted-foreground">Processing...</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { WORKFLOW_STEPS };
