'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGuest } from '@/lib/guest-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  ArrowRight, 
  Plus, 
  Trash2,
  Home,
  Zap,
  Shield,
  Car,
  Wifi,
  CreditCard,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface FixedExpense {
  id: string;
  name: string;
  amount: string;
  icon: string;
}

const SUGGESTED_FIXED_EXPENSES = [
  { name: 'Rent/Mortgage', icon: 'home', placeholder: '1500' },
  { name: 'Utilities', icon: 'zap', placeholder: '150' },
  { name: 'Insurance', icon: 'shield', placeholder: '200' },
  { name: 'Car Payment', icon: 'car', placeholder: '350' },
  { name: 'Internet/Phone', icon: 'wifi', placeholder: '100' },
  { name: 'Subscriptions', icon: 'credit-card', placeholder: '50' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  home: <Home className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  wifi: <Wifi className="h-4 w-4" />,
  'credit-card': <CreditCard className="h-4 w-4" />,
};

export default function GuestSetupPage() {
  const router = useRouter();
  const { guestData, updateGuestSettings, addGuestExpense, completeSetup } = useGuest();
  
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [customExpenseName, setCustomExpenseName] = useState('');
  const [customExpenseAmount, setCustomExpenseAmount] = useState('');

  useEffect(() => {
    if (!guestData) {
      router.push('/auth/login');
    }
  }, [guestData, router]);

  if (!guestData) return null;

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  const handleAddSuggestedExpense = (expense: typeof SUGGESTED_FIXED_EXPENSES[0]) => {
    const exists = fixedExpenses.some(e => e.name === expense.name);
    if (exists) {
      toast.error('This expense is already added');
      return;
    }
    setFixedExpenses([
      ...fixedExpenses,
      {
        id: `expense_${Date.now()}`,
        name: expense.name,
        amount: '',
        icon: expense.icon,
      },
    ]);
  };

  const handleUpdateExpenseAmount = (id: string, amount: string) => {
    setFixedExpenses(fixedExpenses.map(e => 
      e.id === id ? { ...e, amount } : e
    ));
  };

  const handleRemoveExpense = (id: string) => {
    setFixedExpenses(fixedExpenses.filter(e => e.id !== id));
  };

  const handleAddCustomExpense = () => {
    if (!customExpenseName.trim()) {
      toast.error('Please enter an expense name');
      return;
    }
    setFixedExpenses([
      ...fixedExpenses,
      {
        id: `expense_${Date.now()}`,
        name: customExpenseName.trim(),
        amount: customExpenseAmount,
        icon: 'credit-card',
      },
    ]);
    setCustomExpenseName('');
    setCustomExpenseAmount('');
  };

  const handleNextStep = () => {
    if (step === 1) {
      const income = parseFloat(monthlyIncome);
      if (!income || income <= 0) {
        toast.error('Please enter a valid monthly income');
        return;
      }
      updateGuestSettings({ monthly_income: income });
      setStep(2);
    }
  };

  const handleComplete = () => {
    // Add all fixed expenses
    const today = new Date().toISOString().split('T')[0];
    
    fixedExpenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      if (amount > 0) {
        // Find matching category or use default
        const category = guestData.categories.find(c => 
          c.name.toLowerCase().includes(expense.name.toLowerCase().split('/')[0]) ||
          expense.name.toLowerCase().includes(c.name.toLowerCase())
        );
        
        addGuestExpense({
          category_id: category?.id || guestData.categories.find(c => c.type === 'fixed')?.id || null,
          amount,
          description: `${expense.name} (Monthly Fixed)`,
          expense_date: today,
          is_recurring: true,
        });
      }
    });

    completeSetup();
    toast.success('Setup complete! Start tracking your expenses.');
    router.push('/guest');
  };

  const handleSkipFixedExpenses = () => {
    completeSetup();
    toast.success('Setup complete! You can add fixed expenses later.');
    router.push('/guest');
  };

  const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const remainingAfterFixed = (parseFloat(monthlyIncome) || 0) - totalFixedExpenses;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="container max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">PocketPilot</span>
            <Badge variant="secondary" className="text-xs">Setup</Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {step} of {totalSteps}
          </p>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 pb-24">
        {/* Step 1: Set Income */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2 py-6">
              <h1 className="text-2xl font-bold">What&apos;s your monthly income?</h1>
              <p className="text-muted-foreground">
                This helps us calculate your budget health and savings rate
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Label htmlFor="income" className="text-base">Monthly Income (after taxes)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">$</span>
                    <Input
                      id="income"
                      type="number"
                      step="0.01"
                      min="0"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 h-14 text-2xl font-semibold"
                      autoFocus
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your take-home pay, not gross income
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleNextStep} 
              className="w-full h-14 text-lg gap-2"
              disabled={!monthlyIncome || parseFloat(monthlyIncome) <= 0}
            >
              Continue
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Step 2: Add Fixed Expenses */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2 py-4">
              <h1 className="text-2xl font-bold">Add your fixed expenses</h1>
              <p className="text-muted-foreground">
                These are expenses that stay the same each month
              </p>
            </div>

            {/* Income Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Income</p>
                    <p className="text-xl font-bold">${parseFloat(monthlyIncome).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">After Fixed Expenses</p>
                    <p className={`text-xl font-bold ${remainingAfterFixed < 0 ? 'text-destructive' : 'text-green-500'}`}>
                      ${remainingAfterFixed.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggested Fixed Expenses */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Suggested Expenses</CardTitle>
                <CardDescription>Tap to add common fixed expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_FIXED_EXPENSES.map((expense) => {
                    const isAdded = fixedExpenses.some(e => e.name === expense.name);
                    return (
                      <Button
                        key={expense.name}
                        variant={isAdded ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleAddSuggestedExpense(expense)}
                        disabled={isAdded}
                        className="gap-1"
                      >
                        {ICON_MAP[expense.icon]}
                        {expense.name}
                        {isAdded && <Check className="h-3 w-3 ml-1" />}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Added Fixed Expenses */}
            {fixedExpenses.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Fixed Expenses</CardTitle>
                  <CardDescription>Enter the monthly amount for each</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fixedExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {ICON_MAP[expense.icon] || <CreditCard className="h-4 w-4" />}
                      </div>
                      <span className="flex-1 text-sm font-medium">{expense.name}</span>
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={expense.amount}
                          onChange={(e) => handleUpdateExpenseAmount(expense.id, e.target.value)}
                          placeholder="0"
                          className="pl-7 h-9 text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="font-medium">Total Fixed Expenses</span>
                    <span className="font-bold text-lg">${totalFixedExpenses.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Custom Expense */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Custom Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={customExpenseName}
                    onChange={(e) => setCustomExpenseName(e.target.value)}
                    placeholder="Expense name"
                    className="flex-1"
                  />
                  <div className="relative w-24">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customExpenseAmount}
                      onChange={(e) => setCustomExpenseAmount(e.target.value)}
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                  <Button onClick={handleAddCustomExpense} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleComplete} 
                className="w-full h-14 text-lg gap-2"
              >
                <Check className="h-5 w-5" />
                Complete Setup
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSkipFixedExpenses}
                className="w-full"
              >
                Skip for now
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
