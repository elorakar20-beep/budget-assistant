'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { Loader2, Wallet, CheckCircle2, GraduationCap, Briefcase, Building2, PiggyBank, Laptop, Heart, ArrowLeft } from 'lucide-react';

const USER_TYPES = [
  {
    value: 'student',
    label: 'Student',
    description: 'Managing limited funds, part-time income',
    icon: GraduationCap,
    tips: 'Focus on essentials, build savings habits early',
    color: 'bg-blue-500',
  },
  {
    value: 'young_professional',
    label: 'Young Professional',
    description: 'Early career, growing income',
    icon: Briefcase,
    tips: 'Balance lifestyle with savings goals',
    color: 'bg-purple-500',
  },
  {
    value: 'salaried',
    label: 'Salaried Employee',
    description: 'Stable monthly income',
    icon: Building2,
    tips: 'Optimize fixed expenses, maximize savings',
    color: 'bg-emerald-500',
  },
  {
    value: 'non_salaried',
    label: 'Self-Employed / Business',
    description: 'Variable income, business expenses',
    icon: PiggyBank,
    tips: 'Separate business & personal, plan for fluctuations',
    color: 'bg-amber-500',
  },
  {
    value: 'freelancer',
    label: 'Freelancer / Gig Worker',
    description: 'Project-based, irregular income',
    icon: Laptop,
    tips: 'Build buffer fund, track project expenses',
    color: 'bg-cyan-500',
  },
  {
    value: 'retired',
    label: 'Retired',
    description: 'Fixed income, pension/savings',
    icon: Heart,
    tips: 'Preserve capital, manage healthcare costs',
    color: 'bg-rose-500',
  },
];

export default function SignupPage() {
  const [step, setStep] = useState<'userType' | 'details' | 'success'>('userType');
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserType) {
      toast.error('Please select your profile type');
      setStep('userType');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            user_type: selectedUserType,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setStep('success');
      toast.success('Check your email to confirm your account!');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = USER_TYPES.find((t) => t.value === selectedUserType);

  // Success state
  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Budget Check</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
              <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
              <CardDescription>
                We&apos;ve sent a confirmation link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p>Click the link in your email to verify your account and start tracking your budget.</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button variant="outline" className="w-full" onClick={() => router.push('/auth/login')}>
                Back to Sign In
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  // User type selection step
  if (step === 'userType') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Budget Check</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Tell us about yourself
              </h1>
              <p className="text-muted-foreground">
                Select your profile type so we can personalize your budget experience
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {USER_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedUserType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedUserType(type.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-primary text-primary-foreground' : `${type.color} text-white`
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{type.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {type.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <p className="text-xs text-primary mt-3 pt-3 border-t border-primary/20">
                        {type.tips}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                disabled={!selectedUserType}
                onClick={() => setStep('details')}
                className="px-8"
              >
                Continue
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Account details step
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Budget Check</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <button
              type="button"
              onClick={() => setStep('userType')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Change profile type
            </button>

            {selectedType && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                <div className={`p-2 rounded-lg ${selectedType.color} text-white`}>
                  <selectedType.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedType.label}</p>
                  <p className="text-xs text-muted-foreground">{selectedType.tips}</p>
                </div>
              </div>
            )}

            <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              Start tracking your budget and reach your financial goals
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="h-11"
                />
              </div>
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
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
