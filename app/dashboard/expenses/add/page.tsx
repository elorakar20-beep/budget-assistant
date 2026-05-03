import { createClient } from '@/lib/supabase/server';
import { AddExpenseForm } from '@/components/add-expense-form';

export default async function AddExpensePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('type')
    .order('name');

  return <AddExpenseForm categories={categories || []} userId={user.id} />;
}
