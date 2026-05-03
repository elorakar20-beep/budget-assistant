'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { BudgetSettings, Profile, FinancialGoal, RealityCheckTone } from '@/lib/types';
import { FINANCIAL_GOAL_LABELS, TONE_LABELS, TIMEZONE_OPTIONS } from '@/lib/types';

interface SettingsFormProps {
  user: User;
  settings: BudgetSettings | null;
  profile: Profile | null;
}

export function SettingsForm({ user, settings, profile }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Budget settings
    monthly_income: settings?.monthly_income?.toString() || '',
    savings_goal_percent: settings?.savings_goal_percent?.toString() || '20',
    financial_goal: settings?.financial_goal || 'save_more',
    tone: settings?.tone || 'direct',
    report_frequency: settings?.report_frequency || 'twice_monthly',
    email_reports_enabled: settings?.email_reports_enabled ?? true,
    // Profile settings
    full_name: profile?.full_name || '',
    timezone: profile?.timezone || 'America/New_York',
    reminder_enabled: profile?.reminder_enabled ?? true,
    reminder_time: profile?.reminder_time || '21:00',
  });
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    if (!formData.monthly_income || parseFloat(formData.monthly_income) <= 0) {
      toast.error('Please enter your monthly income');
      return;
    }

    setLoading(true);
    try {
      // Update or insert budget settings
      const budgetData = {
        user_id: user.id,
        monthly_income: parseFloat(formData.monthly_income),
        savings_goal_percent: parseFloat(formData.savings_goal_percent),
        financial_goal: formData.financial_goal as FinancialGoal,
        tone: formData.tone as RealityCheckTone,
        report_frequency: formData.report_frequency as 'weekly' | 'twice_monthly' | 'monthly',
        email_reports_enabled: formData.email_reports_enabled,
        updated_at: new Date().toISOString(),
      };

      if (settings) {
        const { error } = await supabase
          .from('budget_settings')
          .update(budgetData)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budget_settings')
          .insert(budgetData);
        if (error) throw error;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          timezone: formData.timezone,
          reminder_enabled: formData.reminder_enabled,
          reminder_time: formData.reminder_time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Settings saved successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your budget preferences and notifications
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email || ''}
              disabled
              className="h-11 bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your name"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget Configuration</CardTitle>
          <CardDescription>Set up your monthly budget parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly_income">Monthly Income *</Label>
            <Input
              id="monthly_income"
              type="number"
              min="0"
              step="100"
              value={formData.monthly_income}
              onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
              placeholder="e.g., 75000"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings_goal">Savings Goal (%)</Label>
            <Input
              id="savings_goal"
              type="number"
              min="0"
              max="100"
              value={formData.savings_goal_percent}
              onChange={(e) => setFormData({ ...formData, savings_goal_percent: e.target.value })}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 20% of income for savings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="financial_goal">Financial Goal</Label>
            <Select
              value={formData.financial_goal}
              onValueChange={(value) => setFormData({ ...formData, financial_goal: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FINANCIAL_GOAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Report Tone</Label>
            <Select
              value={formData.tone}
              onValueChange={(value) => setFormData({ ...formData, tone: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TONE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How you want your budget insights delivered
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>Configure reminders and reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reminder_enabled" className="text-base">Daily Expense Reminder</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to log your daily expenses
              </p>
            </div>
            <Switch
              id="reminder_enabled"
              checked={formData.reminder_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
            />
          </div>

          {formData.reminder_enabled && (
            <div className="space-y-2 pl-0 md:pl-4">
              <Label htmlFor="reminder_time">Reminder Time</Label>
              <Input
                id="reminder_time"
                type="time"
                value={formData.reminder_time}
                onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                className="h-11 w-full md:w-auto"
              />
              <p className="text-xs text-muted-foreground">
                You&apos;ll receive an email reminder at this time daily
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_reports" className="text-base">Email Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive budget analysis reports via email
              </p>
            </div>
            <Switch
              id="email_reports"
              checked={formData.email_reports_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, email_reports_enabled: checked })}
            />
          </div>

          {formData.email_reports_enabled && (
            <div className="space-y-2 pl-0 md:pl-4">
              <Label htmlFor="report_frequency">Report Frequency</Label>
              <Select
                value={formData.report_frequency}
                onValueChange={(value) => setFormData({ ...formData, report_frequency: value })}
              >
                <SelectTrigger className="h-11 w-full md:w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="twice_monthly">Twice Monthly (15th & End)</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
