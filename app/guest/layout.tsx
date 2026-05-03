'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGuest } from '@/lib/guest-context';
import { GuestNav } from '@/components/guest-nav';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isGuest, guestData } = useGuest();
  const router = useRouter();

  useEffect(() => {
    if (!isGuest || !guestData) {
      router.push('/auth/login');
    }
  }, [isGuest, guestData, router]);

  if (!isGuest || !guestData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GuestNav />
      <main className="flex-1 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}
