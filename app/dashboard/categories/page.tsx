import { createClient } from '@/lib/supabase/server';
import { CategoriesManager } from '@/components/categories-manager';

export default async function CategoriesPage() {
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

  return <CategoriesManager categories={categories || []} userId={user.id} />;
}
