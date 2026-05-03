import { createClient } from '@/lib/supabase/server';
import { ReportsView } from '@/components/reports-view';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch monthly snapshots
  const { data: snapshots } = await supabase
    .from('monthly_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('month_year', { ascending: false })
    .limit(12);

  // Fetch scheduled reports
  const { data: reports } = await supabase
    .from('scheduled_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch current month expenses for real-time analysis
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, category:expense_categories(*)')
    .eq('user_id', user.id)
    .gte('expense_date', startOfMonth.toISOString().split('T')[0]);

  const { data: settings } = await supabase
    .from('budget_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <ReportsView
      snapshots={snapshots || []}
      reports={reports || []}
      currentExpenses={expenses || []}
      settings={settings}
      userId={user.id}
    />
  );
}
