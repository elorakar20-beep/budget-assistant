'use client';

import { useState } from 'react';
import { useGuest } from '@/lib/guest-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Trash2, Edit2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

const colorOptions = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6b7280',
];

export default function GuestCategoriesPage() {
  const { guestData, addGuestCategory, updateGuestCategory, deleteGuestCategory } = useGuest();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'fixed' | 'variable'>('variable');
  const [color, setColor] = useState('#6366f1');
  const [budgetLimit, setBudgetLimit] = useState('');

  if (!guestData) return null;

  const { categories } = guestData;
  const fixedCategories = categories.filter((c) => c.type === 'fixed');
  const variableCategories = categories.filter((c) => c.type === 'variable');

  const resetForm = () => {
    setName('');
    setType('variable');
    setColor('#6366f1');
    setBudgetLimit('');
    setEditingId(null);
  };

  const openEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setName(cat.name);
    setType(cat.type as 'fixed' | 'variable');
    setColor(cat.color || '#6366f1');
    setBudgetLimit(cat.budget_limit?.toString() || '');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const data = {
      name: name.trim(),
      type,
      color,
      budget_limit: budgetLimit ? parseFloat(budgetLimit) : null,
      icon: 'receipt',
      is_default: false,
    };

    if (editingId) {
      updateGuestCategory(editingId, data);
      toast.success('Category updated!');
    } else {
      addGuestCategory(data);
      toast.success('Category added!');
    }

    resetForm();
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteGuestCategory(id);
    toast.success('Category deleted');
  };

  const CategoryList = ({ items, title }: { items: typeof categories; title: string }) => (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>
      {items.length > 0 ? (
        <div className="grid gap-2">
          {items.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="py-3 flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <FolderOpen className="h-5 w-5" style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cat.name}</p>
                  {cat.budget_limit && (
                    <p className="text-sm text-muted-foreground">
                      Budget: ${cat.budget_limit.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {!cat.is_default && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} yet</p>
      )}
    </div>
  );

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage your expense categories</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
              <DialogDescription>
                Create custom categories to organize your expenses
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Gym Membership"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'fixed' | 'variable')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (recurring monthly)</SelectItem>
                    <SelectItem value="variable">Variable (changes monthly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget Limit (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    min="0"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingId ? 'Update Category' : 'Add Category'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        <CategoryList items={fixedCategories} title="Fixed Expenses" />
        <CategoryList items={variableCategories} title="Variable Expenses" />
      </div>
    </div>
  );
}
