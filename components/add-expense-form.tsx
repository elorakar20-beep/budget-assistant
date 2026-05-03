'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Receipt, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { ExpenseCategory } from '@/lib/types';

interface AddExpenseFormProps {
  categories: ExpenseCategory[];
  userId: string;
}

export function AddExpenseForm({ categories, userId }: AddExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fixedCategories = categories.filter((c) => c.type === 'fixed');
  const variableCategories = categories.filter((c) => c.type === 'variable');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: userId,
        amount: parseFloat(amount),
        category_id: categoryId || null,
        description: description.trim() || null,
        expense_date: expenseDate,
      });

      if (error) throw error;

      toast.success('Expense added successfully');
      router.push('/dashboard/expenses');
      router.refresh();
    } catch (error) {
      toast.error('Failed to add expense');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (cat: ExpenseCategory, quickAmount: number) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: userId,
        amount: quickAmount,
        category_id: cat.id,
        description: null,
        expense_date: format(new Date(), 'yyyy-MM-dd'),
      });

      if (error) throw error;

      toast.success(`Added ${quickAmount} to ${cat.name}`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to add expense');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Expense</h1>
          <p className="text-muted-foreground">Record a new expense</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Details</CardTitle>
            <CardDescription>Enter the details of your expense</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 text-lg"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {variableCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Variable Expenses
                        </div>
                        {variableCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {fixedCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                          Fixed Expenses
                        </div>
                        {fixedCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    <Link href="/dashboard/categories" className="text-primary hover:underline">
                      Add categories
                    </Link>{' '}
                    to organize your expenses
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Lunch at cafe, Monthly subscription..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Add */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Add</CardTitle>
            <CardDescription>
              Tap a category to quickly add common amounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-3">No categories yet</p>
                <Link href="/dashboard/categories">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Categories
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {variableCategories.slice(0, 6).map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[50, 100, 200, 500].map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAdd(cat, quickAmount)}
                          disabled={loading}
                          className="h-8"
                        >
                          +{quickAmount}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
