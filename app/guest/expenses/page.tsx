'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGuest } from '@/lib/guest-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2,
  Receipt
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

export default function GuestExpensesPage() {
  const { guestData, deleteGuestExpense } = useGuest();
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  if (!guestData) return null;

  const { expenses, categories } = guestData;

  // Filter expenses by month and search
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));

  const filteredExpenses = expenses
    .filter((e) => isWithinInterval(parseISO(e.expense_date), { start: monthStart, end: monthEnd }))
    .filter((e) => 
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      categories.find((c) => c.id === e.category_id)?.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const handleDelete = (id: string) => {
    deleteGuestExpense(id);
    toast.success('Expense deleted');
  };

  // Group expenses by date
  const groupedByDate = filteredExpenses.reduce((acc, expense) => {
    const date = expense.expense_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, typeof filteredExpenses>);

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track your daily spending</p>
        </div>
        <Link href="/guest/expenses/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total for {format(monthStart, 'MMMM yyyy')}</p>
              <p className="text-2xl font-bold">${totalAmount.toLocaleString()}</p>
            </div>
            <Badge variant="secondary">{filteredExpenses.length} expenses</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {Object.keys(groupedByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dayExpenses]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {format(parseISO(date), 'EEEE, MMMM d')}
              </h3>
              <div className="space-y-2">
                {dayExpenses.map((expense) => {
                  const category = categories.find((c) => c.id === expense.category_id);
                  return (
                    <Card key={expense.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category?.color || '#6b7280'}20` }}
                          >
                            <Receipt 
                              className="h-5 w-5" 
                              style={{ color: category?.color || '#6b7280' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {expense.description || category?.name || 'Expense'}
                            </p>
                            {category && (
                              <p className="text-sm text-muted-foreground">{category.name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${Number(expense.amount).toLocaleString()}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">No expenses found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? 'Try a different search term' : 'Start tracking your spending'}
            </p>
            <Link href="/guest/expenses/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
