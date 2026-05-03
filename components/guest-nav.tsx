'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useGuest } from '@/lib/guest-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Wallet, 
  Home, 
  Receipt, 
  FolderOpen, 
  Settings, 
  Plus,
  User,
  LogOut,
  BarChart3,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
  { href: '/guest', label: 'Dashboard', icon: Home },
  { href: '/guest/expenses', label: 'Expenses', icon: Receipt },
  { href: '/guest/categories', label: 'Categories', icon: FolderOpen },
  { href: '/guest/reports', label: 'Reports', icon: BarChart3 },
  { href: '/guest/settings', label: 'Settings', icon: Settings },
];

export function GuestNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearGuestData, guestData } = useGuest();

  const handleSignOut = () => {
    clearGuestData();
    toast.success('Guest session ended');
    router.push('/');
  };

  const handleCreateAccount = () => {
    router.push('/auth/signup');
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between border-b bg-card px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/guest" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">PocketPilot</span>
            <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
              Guest
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/guest/expenses/add">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </Link>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{guestData?.profile?.full_name || 'Guest User'}</p>
                <p className="text-xs text-muted-foreground">Local data only</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateAccount}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                End Guest Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Link href="/guest" className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-semibold">PocketPilot</span>
          <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
            Guest
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground">
                <User className="h-5 w-5" />
                <span className="text-xs">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{guestData?.profile?.full_name || 'Guest User'}</p>
                <p className="text-xs text-muted-foreground">Local data only</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/guest/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateAccount}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                End Guest Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Floating Action Button for Mobile */}
      <Link
        href="/guest/expenses/add"
        className="md:hidden fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </>
  );
}
