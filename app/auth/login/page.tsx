'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useGuest } from '@/lib/guest-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { Loader2, Wallet, User, GraduationCap, Briefcase, Building2, UserCircle, Palmtree } from 'lucide-react';
import type { UserType } from '@/lib/types';

const userTypeOptions: { value: UserType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'In school or university' },
  { value: 'young_professional', label: 'Young Professional', icon: UserCircle, description: 'Early career, building wealth' },
  { value: 'salaried', label: 'Salaried', icon: Building2, description: 'Fixed monthly income' },
  { value: 'non_salaried', label: 'Self-Employed', icon: Briefcase, description: 'Business owner or contractor' },
  { value: 'freelancer', label: 'Freelancer', icon: User, description: 'Gig work or project-based' },
  { value: 'retired', label: 'Retired', icon: Palmtree, description: 'Living on savings/pension' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuestOptions, setShowGuestOptions] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('salaried');
  const router = useRouter();
  const supabase = createClient();
  const { setGuestMode } = useGuest();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuestMode(true, selectedUserType);
    toast.success('Welcome! Let\'s set up your budget.');
    router.push('/guest/setup');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">PocketPilot</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {!showGuestOptions ? (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">PocketPilot</CardTitle>
                <p className="text-sm text-primary font-medium">Tiny checks. Big savings.</p>
                <CardDescription>
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-11"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                  
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => setShowGuestOptions(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Continue as Guest
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                      Sign up
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Guest Mode</CardTitle>
                <CardDescription className="text-center">
                  Tell us about yourself for personalized budget tips
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={selectedUserType}
                  onValueChange={(value) => setSelectedUserType(value as UserType)}
                  className="grid gap-3"
                >
                  {userTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Label
                        key={option.value}
                        htmlFor={option.value}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedUserType === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                        <div className={`p-2 rounded-lg ${
                          selectedUserType === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <strong>Note:</strong> Guest data is stored locally in your browser. 
                    Create an account to sync across devices and get email reports.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full h-11" onClick={handleGuestLogin}>
                  Continue as Guest
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowGuestOptions(false)}
                >
                  Back to Sign In
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
