'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FolderCog } from 'lucide-react';
import type { ExpenseCategory } from '@/lib/types';
import { DEFAULT_FIXED_CATEGORIES, DEFAULT_VARIABLE_CATEGORIES } from '@/lib/types';

const ICON_OPTIONS = [
  'home', 'zap', 'shield', 'credit-card', 'tv', 'shopping-cart', 'utensils',
  'car', 'shopping-bag', 'film', 'heart-pulse', 'plane', 'gamepad-2',
  'sparkles', 'more-horizontal', 'receipt', 'gift', 'coffee', 'music',
  'book', 'briefcase', 'phone', 'wifi', 'droplet', 'flame'
];

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6b7280'
];

interface CategoriesManagerProps {
  categories: ExpenseCategory[];
  userId: string;
}

export function CategoriesManager({ categories, userId }: CategoriesManagerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'variable' as 'fixed' | 'variable',
    icon: 'receipt',
    color: '#6366f1',
    budget_limit: '',
  });
  const router = useRouter();
  const supabase = createClient();

  const fixedCategories = categories.filter((c) => c.type === 'fixed');
  const variableCategories = categories.filter((c) => c.type === 'variable');

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'variable',
      icon: 'receipt',
      color: '#6366f1',
      budget_limit: '',
    });
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('expense_categories').insert({
        user_id: userId,
        name: formData.name.trim(),
        type: formData.type,
        icon: formData.icon,
        color: formData.color,
        budget_limit: formData.budget_limit ? parseFloat(formData.budget_limit) : null,
      });

      if (error) throw error;

      toast.success('Category added successfully');
      setIsAddOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error('Failed to add category');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({
          name: formData.name.trim(),
          type: formData.type,
          icon: formData.icon,
          color: formData.color,
          budget_limit: formData.budget_limit ? parseFloat(formData.budget_limit) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast.success('Category updated successfully');
      setEditingCategory(null);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error('Failed to update category');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: ExpenseCategory) => {
    if (!confirm(`Delete "${category.name}"? Expenses in this category will become uncategorized.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast.success('Category deleted');
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
    }
  };

  const handleAddDefaults = async (type: 'fixed' | 'variable') => {
    const defaults = type === 'fixed' ? DEFAULT_FIXED_CATEGORIES : DEFAULT_VARIABLE_CATEGORIES;
    const existingNames = categories.map((c) => c.name.toLowerCase());
    const newCategories = defaults.filter(
      (d) => !existingNames.includes(d.name.toLowerCase())
    );

    if (newCategories.length === 0) {
      toast.info('All default categories already exist');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('expense_categories').insert(
        newCategories.map((c) => ({
          user_id: userId,
          name: c.name,
          type,
          icon: c.icon,
          color: c.color,
          is_default: true,
        }))
      );

      if (error) throw error;

      toast.success(`Added ${newCategories.length} ${type} categories`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to add default categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (category: ExpenseCategory) => {
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      budget_limit: category.budget_limit?.toString() || '',
    });
    setEditingCategory(category);
  };

  const CategoryForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Travel, Recreation"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value: 'fixed' | 'variable') => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Expense</SelectItem>
            <SelectItem value="variable">Variable Expense</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Fixed: recurring monthly expenses. Variable: day-to-day spending.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-8 w-8 rounded-lg transition-all ${
                formData.color === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, color })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget_limit">Monthly Budget Limit (optional)</Label>
        <Input
          id="budget_limit"
          type="number"
          value={formData.budget_limit}
          onChange={(e) => setFormData({ ...formData, budget_limit: e.target.value })}
          placeholder="e.g., 5000"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          You&apos;ll get an alert when spending exceeds this limit.
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expense Categories</h1>
          <p className="text-muted-foreground">
            Customize your fixed and variable expense categories
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Category</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new expense category for tracking
              </DialogDescription>
            </DialogHeader>
            <CategoryForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fixed Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Fixed Expenses</CardTitle>
              <CardDescription>
                Recurring monthly expenses like rent, utilities, subscriptions
              </CardDescription>
            </div>
            {fixedCategories.length === 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAddDefaults('fixed')}
                disabled={loading}
              >
                Add Defaults
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {fixedCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderCog className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No fixed expense categories yet</p>
              <p className="text-sm">Add default categories or create your own</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {fixedCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.budget_limit && (
                        <p className="text-xs text-muted-foreground">
                          Limit: {category.budget_limit.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variable Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Variable Expenses</CardTitle>
              <CardDescription>
                Day-to-day spending like groceries, dining, entertainment
              </CardDescription>
            </div>
            {variableCategories.length === 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAddDefaults('variable')}
                disabled={loading}
              >
                Add Defaults
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {variableCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderCog className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No variable expense categories yet</p>
              <p className="text-sm">Add default categories or create your own</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {variableCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.budget_limit && (
                        <p className="text-xs text-muted-foreground">
                          Limit: {category.budget_limit.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details
            </DialogDescription>
          </DialogHeader>
          <CategoryForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
