import { createClient } from '@/lib/supabase/server';
import { ExpensesList } from '@/components/expenses-list';

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch expenses for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, category:expense_categories(*)')
    .eq('user_id', user.id)
    .gte('expense_date', startOfMonth.toISOString().split('T')[0])
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  const { data: settings } = await supabase
    .from('budget_settings')
    .select('monthly_income')
    .eq('user_id', user.id)
    .single();

  return (
    <ExpensesList 
      expenses={expenses || []} 
      categories={categories || []}
      monthlyIncome={settings?.monthly_income || 0}
      userId={user.id}
    />
  );
}
