'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGuest } from '@/lib/guest-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

export default function GuestAddExpensePage() {
  const router = useRouter();
  const { guestData, addGuestExpense } = useGuest();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  if (!guestData) return null;

  const { categories } = guestData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      addGuestExpense({
        amount: parseFloat(amount),
        description,
        category_id: categoryId || null,
        expense_date: date,
        is_recurring: false,
      });
      
      toast.success('Expense added!');
      router.push('/guest/expenses');
    } catch {
      toast.error('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  // Group categories by type
  const fixedCategories = categories.filter((c) => c.type === 'fixed');
  const variableCategories = categories.filter((c) => c.type === 'variable');

  return (
    <div className="container max-w-lg mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/guest/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Expense</h1>
          <p className="text-muted-foreground">Record a new expense</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 text-2xl h-14 font-bold"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {[...fixedCategories, ...variableCategories].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      categoryId === cat.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <Receipt className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                    <p className="text-xs truncate">{cat.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? 'Adding...' : 'Add Expense'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
