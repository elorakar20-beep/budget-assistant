import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Manual report generation endpoint - can be triggered from dashboard
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reportType = body.reportType || 'manual';

    const today = new Date();

    // Get user settings
    const { data: settings } = await supabase
      .from('budget_settings')
      .select('monthly_income, savings_goal_percent, financial_goal, tone')
      .eq('user_id', user.id)
      .single();

    const income = Number(settings?.monthly_income || 0);
    const tone = settings?.tone || 'direct';

    // Get current month expenses
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category_id, expense_date, expense_categories(name, type)')
      .eq('user_id', user.id)
      .gte('expense_date', startOfMonth.toISOString().split('T')[0]);

    // Calculate totals
    const totalExpenses = (expenses || []).reduce((sum, exp) => sum + Number(exp.amount), 0);
    const savings = income - totalExpenses;
    const savingsRate = income > 0 ? (savings / income) : 0;
    const expenseRatio = income > 0 ? (totalExpenses / income) : 0;

    // Calculate health score
    let healthScore = 100;
    if (expenseRatio > 0.9) healthScore -= 40;
    else if (expenseRatio > 0.8) healthScore -= 25;
    else if (expenseRatio > 0.7) healthScore -= 10;
    if (savingsRate < 0.1) healthScore -= 20;
    else if (savingsRate < 0.2) healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const healthStatus = healthScore >= 70 ? 'Stable' : healthScore >= 40 ? 'Needs Attention' : 'Red Zone';

    // Get category breakdown
    const categoryBreakdown: Record<string, number> = {};
    (expenses || []).forEach((exp) => {
      const catName = (exp.expense_categories as { name: string } | null)?.name || 'Uncategorized';
      categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + Number(exp.amount);
    });

    // Get top spending categories
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }));

    // Get previous month snapshot for comparison
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const { data: prevSnapshot } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_year', prevMonth.toISOString().split('T')[0])
      .single();

    // Calculate change reasons
    const changeReasons = [];
    if (prevSnapshot) {
      const expenseChange = totalExpenses - Number(prevSnapshot.total_expenses);
      const expenseChangePercent = Number(prevSnapshot.total_expenses) > 0 
        ? (expenseChange / Number(prevSnapshot.total_expenses)) * 100 
        : 0;

      if (Math.abs(expenseChangePercent) > 10) {
        changeReasons.push({
          category: 'Overall Spending',
          type: expenseChange > 0 ? 'increase' : 'decrease',
          amount_change: expenseChange,
          percentage_change: expenseChangePercent,
          impact: expenseChange > 0 ? 'negative' : 'positive',
          description: `Spending ${expenseChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(expenseChangePercent).toFixed(1)}% compared to last month`,
        });
      }

      // Compare categories
      const prevCategories = prevSnapshot.category_breakdown as Record<string, number> || {};
      Object.entries(categoryBreakdown).forEach(([category, amount]) => {
        const prevAmount = prevCategories[category] || 0;
        const change = amount - prevAmount;
        const changePercent = prevAmount > 0 ? (change / prevAmount) * 100 : 100;
        
        if (Math.abs(change) > 50 && Math.abs(changePercent) > 20) {
          changeReasons.push({
            category,
            type: change > 0 ? 'increase' : 'decrease',
            amount_change: change,
            percentage_change: changePercent,
            impact: change > 0 ? 'negative' : 'positive',
            description: `${category} spending ${change > 0 ? 'increased' : 'decreased'} by $${Math.abs(change).toFixed(2)} (${Math.abs(changePercent).toFixed(1)}%)`,
          });
        }
      });
    }

    // Generate report summary based on tone
    let summary = '';
    if (tone === 'gentle') {
      if (healthScore >= 70) {
        summary = `Great job! Your budget is looking healthy with a score of ${healthScore}. You've spent ${Math.round(expenseRatio * 100)}% of your income and saved ${Math.round(savingsRate * 100)}%.`;
      } else if (healthScore >= 40) {
        summary = `Your budget needs some attention with a score of ${healthScore}. Consider reviewing your spending in ${topCategories[0]?.name || 'your top categories'}.`;
      } else {
        summary = `Let's work together to improve your budget health (currently at ${healthScore}). Small changes can make a big difference!`;
      }
    } else if (tone === 'direct') {
      summary = `Budget Health: ${healthScore}/100 (${healthStatus}). Spent: ${Math.round(expenseRatio * 100)}% of income. Savings rate: ${Math.round(savingsRate * 100)}%. Top category: ${topCategories[0]?.name || 'N/A'}.`;
    } else {
      // spicy
      if (healthScore >= 70) {
        summary = `Your wallet is breathing easy! Score: ${healthScore}. Keep this up and your future self will thank you.`;
      } else if (healthScore >= 40) {
        summary = `Score: ${healthScore}. Your money is doing a disappearing act - time to figure out where it's going!`;
      } else {
        summary = `Red alert! Score: ${healthScore}. Your spending is out of control. Time for an intervention!`;
      }
    }

    const reportData = {
      health_score: healthScore,
      health_status: healthStatus,
      total_expenses: totalExpenses,
      total_income: income,
      total_savings: savings,
      expense_ratio: expenseRatio,
      savings_rate: savingsRate,
      category_breakdown: categoryBreakdown,
      top_categories: topCategories,
      summary,
      generated_at: new Date().toISOString(),
    };

    // Store the report
    const { error: insertError } = await supabase
      .from('scheduled_reports')
      .insert({
        user_id: user.id,
        report_type: reportType,
        report_data: reportData,
        comparison_data: prevSnapshot ? {
          prev_month: prevMonth.toISOString().split('T')[0],
          prev_expenses: Number(prevSnapshot.total_expenses),
          prev_savings: Number(prevSnapshot.total_savings),
          prev_health_score: prevSnapshot.health_score,
          prev_expense_ratio: Number(prevSnapshot.expense_ratio),
          prev_savings_rate: Number(prevSnapshot.savings_rate),
        } : null,
        change_reasons: changeReasons,
        email_status: 'sent', // Mark as sent since user generated it manually
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing report:', insertError);
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      comparison: prevSnapshot ? {
        prev_month: prevMonth.toISOString().split('T')[0],
        prev_expenses: Number(prevSnapshot.total_expenses),
        prev_health_score: prevSnapshot.health_score,
      } : null,
      changeReasons,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
