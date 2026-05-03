'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Receipt, 
  Trash2, 
  Calendar,
  TrendingUp,
  Filter
} from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { CURRENCY_SYMBOLS } from '@/lib/types';

interface ExpensesListProps {
  expenses: (Expense & { category: ExpenseCategory | null })[];
  categories: ExpenseCategory[];
  monthlyIncome: number;
  userId: string;
}

export function ExpensesList({ expenses, categories, monthlyIncome, userId }: ExpensesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();
  const supabase = createClient();
  const currencySymbol = CURRENCY_SYMBOLS['INR'];

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = !searchQuery || 
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        expense.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof filteredExpenses> = {};
    
    filteredExpenses.forEach((expense) => {
      const date = expense.expense_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredExpenses]);

  // Calculate totals
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const handleDelete = async (expense: Expense) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);

      if (error) throw error;

      toast.success('Expense deleted');
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete expense');
      console.error(error);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  };

  const getDayTotal = (dayExpenses: typeof filteredExpenses) => {
    return dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'MMMM yyyy')}
          </p>
        </div>
        <Link href="/dashboard/expenses/add" className="hidden md:block">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent This Month</p>
              <p className="text-2xl font-bold">
                {currencySymbol}{totalSpent.toLocaleString()}
              </p>
            </div>
            {monthlyIncome > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">of {currencySymbol}{monthlyIncome.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span className={totalSpent > monthlyIncome ? 'text-destructive' : 'text-success'}>
                    {((totalSpent / monthlyIncome) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-11">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expenses List */}
      {groupedExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No expenses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your filters'
                : 'Start tracking your spending by adding an expense'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Link href="/dashboard/expenses/add">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Expense
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedExpenses.map(([date, dayExpenses]) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">{formatDateLabel(date)}</h3>
                </div>
                <Badge variant="secondary">
                  {currencySymbol}{getDayTotal(dayExpenses).toLocaleString()}
                </Badge>
              </div>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {dayExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${expense.category?.color || '#6b7280'}20` }}
                        >
                          <Receipt 
                            className="h-5 w-5" 
                            style={{ color: expense.category?.color || '#6b7280' }} 
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {expense.description || expense.category?.name || 'Expense'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category?.name || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {currencySymbol}{Number(expense.amount).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(expense)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
