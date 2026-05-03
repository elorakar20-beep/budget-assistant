import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/settings-form';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: settings } = await supabase
    .from('budget_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <SettingsForm user={user} settings={settings} profile={profile} />;
}
