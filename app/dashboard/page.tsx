import { createClient } from '@/lib/supabase/server';
import { DashboardOverview } from '@/components/dashboard-overview';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user's budget settings
  const { data: settings } = await supabase
    .from('budget_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch this month's expenses
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, category:expense_categories(*)')
    .eq('user_id', user.id)
    .gte('expense_date', startOfMonth.toISOString().split('T')[0])
    .order('expense_date', { ascending: false });

  // Fetch expense categories
  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('user_id', user.id);

  // Fetch recent monthly snapshots for comparison
  const { data: snapshots } = await supabase
    .from('monthly_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('month_year', { ascending: false })
    .limit(3);

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <DashboardOverview
      user={user}
      settings={settings}
      expenses={expenses || []}
      categories={categories || []}
      snapshots={snapshots || []}
      profile={profile}
    />
  );
}
