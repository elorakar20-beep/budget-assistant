'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type BudgetInput,
  type Currency,
  type FinancialGoal,
  type RealityCheckTone,
  SAMPLE_DATA,
  CURRENCY_SYMBOLS,
  FINANCIAL_GOAL_LABELS,
  TONE_LABELS,
} from '@/lib/types';
import { Briefcase, GraduationCap, TrendingDown, Loader2 } from 'lucide-react';

interface BudgetFormProps {
  onSubmit: (data: BudgetInput) => void;
  isLoading: boolean;
}

const defaultValues: BudgetInput = {
  monthlyIncome: 0,
  currency: 'INR',
  rent: 0,
  groceries: 0,
  eatingOut: 0,
  transport: 0,
  subscriptions: 0,
  shopping: 0,
  debtEmi: 0,
  savingsInvestments: 0,
  medical: 0,
  familySupport: 0,
  miscellaneous: 0,
  financialGoal: 'understand_spending',
  tone: 'direct',
  notes: '',
};

export function BudgetForm({ onSubmit, isLoading }: BudgetFormProps) {
  const [formData, setFormData] = useState<BudgetInput>(defaultValues);

  const updateField = <K extends keyof BudgetInput>(field: K, value: BudgetInput[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadSampleData = (type: 'youngProfessional' | 'studentBudget' | 'salaryVanishing') => {
    setFormData(SAMPLE_DATA[type]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const currencySymbol = CURRENCY_SYMBOLS[formData.currency];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sample Data Buttons */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Start</CardTitle>
          <CardDescription>Load sample data to explore the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadSampleData('youngProfessional')}
              className="gap-2"
            >
              <Briefcase className="size-4" />
              Young Professional
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadSampleData('studentBudget')}
              className="gap-2"
            >
              <GraduationCap className="size-4" />
              Student Budget
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadSampleData('salaryVanishing')}
              className="gap-2"
            >
              <TrendingDown className="size-4" />
              Salary Vanishing Act
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Income & Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Monthly Income</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  id="monthlyIncome"
                  type="number"
                  min="0"
                  value={formData.monthlyIncome || ''}
                  onChange={(e) => updateField('monthlyIncome', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => updateField('currency', value as Currency)}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fixed Expenses</CardTitle>
          <CardDescription>Regular monthly commitments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rent">Rent / Housing</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="rent"
                  type="number"
                  min="0"
                  value={formData.rent || ''}
                  onChange={(e) => updateField('rent', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtEmi">Debt / EMI</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="debtEmi"
                  type="number"
                  min="0"
                  value={formData.debtEmi || ''}
                  onChange={(e) => updateField('debtEmi', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="familySupport">Family Support</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="familySupport"
                  type="number"
                  min="0"
                  value={formData.familySupport || ''}
                  onChange={(e) => updateField('familySupport', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variable Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variable Expenses</CardTitle>
          <CardDescription>Day-to-day and lifestyle spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="groceries">Groceries</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="groceries"
                  type="number"
                  min="0"
                  value={formData.groceries || ''}
                  onChange={(e) => updateField('groceries', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eatingOut">Eating Out</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="eatingOut"
                  type="number"
                  min="0"
                  value={formData.eatingOut || ''}
                  onChange={(e) => updateField('eatingOut', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transport">Transport</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="transport"
                  type="number"
                  min="0"
                  value={formData.transport || ''}
                  onChange={(e) => updateField('transport', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriptions">Subscriptions</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="subscriptions"
                  type="number"
                  min="0"
                  value={formData.subscriptions || ''}
                  onChange={(e) => updateField('subscriptions', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopping">Shopping</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="shopping"
                  type="number"
                  min="0"
                  value={formData.shopping || ''}
                  onChange={(e) => updateField('shopping', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medical">Medical</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="medical"
                  type="number"
                  min="0"
                  value={formData.medical || ''}
                  onChange={(e) => updateField('medical', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="miscellaneous">Miscellaneous</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="miscellaneous"
                  type="number"
                  min="0"
                  value={formData.miscellaneous || ''}
                  onChange={(e) => updateField('miscellaneous', Number(e.target.value))}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Savings & Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="savingsInvestments">Monthly Savings / Investments</Label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currencySymbol}
              </span>
              <Input
                id="savingsInvestments"
                type="number"
                min="0"
                value={formData.savingsInvestments || ''}
                onChange={(e) => updateField('savingsInvestments', Number(e.target.value))}
                className="pl-8"
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Goal</CardTitle>
          <CardDescription>What do you want to focus on?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.financialGoal}
            onValueChange={(value) => updateField('financialGoal', value as FinancialGoal)}
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {(Object.entries(FINANCIAL_GOAL_LABELS) as [FinancialGoal, string][]).map(
              ([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={value} />
                  <Label htmlFor={value} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              )
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Reality Check Tone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reality Check Tone</CardTitle>
          <CardDescription>How should we deliver the feedback?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.tone}
            onValueChange={(value) => updateField('tone', value as RealityCheckTone)}
            className="flex flex-wrap gap-4"
          >
            {(Object.entries(TONE_LABELS) as [RealityCheckTone, string][]).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`tone-${value}`} />
                <Label htmlFor={`tone-${value}`} className="font-normal cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Notes</CardTitle>
          <CardDescription>Optional context about your situation</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Any specific concerns or context..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isLoading || !formData.monthlyIncome}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Analyzing Budget...
          </>
        ) : (
          'Run Budget Reality Check'
        )}
      </Button>
    </form>
  );
}
