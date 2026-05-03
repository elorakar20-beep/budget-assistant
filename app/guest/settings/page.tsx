'use client';

import { useState, useEffect } from 'react';
import { useGuest } from '@/lib/guest-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { USER_TYPE_LABELS, type UserType } from '@/lib/types';

export default function GuestSettingsPage() {
  const { guestData, updateGuestProfile, updateGuestSettings } = useGuest();
  
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<UserType>('salaried');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('20');
  const [financialGoal, setFinancialGoal] = useState('save_more');
  const [tone, setTone] = useState<'gentle' | 'direct' | 'spicy'>('direct');

  useEffect(() => {
    if (guestData) {
      setFullName(guestData.profile.full_name || '');
      setUserType((guestData.profile.user_type as UserType) || 'salaried');
      setMonthlyIncome(guestData.settings.monthly_income?.toString() || '');
      setSavingsGoal(guestData.settings.savings_goal_percent?.toString() || '20');
      setFinancialGoal(guestData.settings.financial_goal || 'save_more');
      setTone((guestData.settings.tone as 'gentle' | 'direct' | 'spicy') || 'direct');
    }
  }, [guestData]);

  if (!guestData) return null;

  const handleSave = () => {
    updateGuestProfile({
      full_name: fullName,
      user_type: userType,
    });
    updateGuestSettings({
      monthly_income: parseFloat(monthlyIncome) || 0,
      savings_goal_percent: parseFloat(savingsGoal) || 20,
      financial_goal: financialGoal,
      tone,
    });
    toast.success('Settings saved!');
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your budget preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Profile Type</Label>
            <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(USER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
          <CardDescription>Your monthly budget configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly Income</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="income"
                type="number"
                step="0.01"
                min="0"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="savings">Savings Goal (%)</Label>
            <Input
              id="savings"
              type="number"
              min="0"
              max="100"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Financial Goal</Label>
            <Select value={financialGoal} onValueChange={setFinancialGoal}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="save_more">Save More Money</SelectItem>
                <SelectItem value="pay_debt">Pay Off Debt</SelectItem>
                <SelectItem value="stop_overspending">Stop Overspending</SelectItem>
                <SelectItem value="build_emergency_fund">Build Emergency Fund</SelectItem>
                <SelectItem value="prepare_big_purchase">Prepare for Big Purchase</SelectItem>
                <SelectItem value="understand_spending">Understand Spending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tone */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Style</CardTitle>
          <CardDescription>How would you like feedback delivered?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <RadioGroupItem value="gentle" id="gentle" />
              <Label htmlFor="gentle" className="flex-1 cursor-pointer">
                <span className="font-medium">Gentle</span>
                <p className="text-sm text-muted-foreground">Supportive and encouraging feedback</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <RadioGroupItem value="direct" id="direct" />
              <Label htmlFor="direct" className="flex-1 cursor-pointer">
                <span className="font-medium">Direct</span>
                <p className="text-sm text-muted-foreground">Clear and factual analysis</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <RadioGroupItem value="spicy" id="spicy" />
              <Label htmlFor="spicy" className="flex-1 cursor-pointer">
                <span className="font-medium">Spicy</span>
                <p className="text-sm text-muted-foreground">Witty and memorable reality checks</p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full h-12">
        Save Settings
      </Button>
    </div>
  );
}
