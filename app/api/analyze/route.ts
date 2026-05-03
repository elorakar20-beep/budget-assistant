import { start, getRun } from 'workflow/api';
import { NextResponse } from 'next/server';
import { budgetRealityWorkflow } from '@/workflows/budget-reality-workflow';
import type { BudgetInput, BudgetReport } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const input: BudgetInput = await request.json();

    // Validate required fields
    if (!input.monthlyIncome || input.monthlyIncome <= 0) {
      return NextResponse.json(
        { error: 'Monthly income is required and must be positive' },
        { status: 400 }
      );
    }

    // Start the workflow
    const run = await start(budgetRealityWorkflow, [input]);

    return NextResponse.json({
      runId: run.runId,
      status: 'started',
      message: 'Budget analysis workflow started',
    });
  } catch (error) {
    console.error('Error starting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to start budget analysis' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 }
      );
    }

    const run = getRun(runId);
    
    // Check if workflow is complete
    try {
      const result = await Promise.race([
        run.returnValue,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 100)
        ),
      ]) as BudgetReport;

      return NextResponse.json({
        status: 'completed',
        result,
      });
    } catch {
      // Workflow still running or error
      return NextResponse.json({
        status: 'running',
        runId,
      });
    }
  } catch (error) {
    console.error('Error checking workflow status:', error);
    return NextResponse.json(
      { error: 'Failed to check workflow status' },
      { status: 500 }
    );
  }
}
