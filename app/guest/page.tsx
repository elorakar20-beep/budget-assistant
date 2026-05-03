'use client';

import { useGuest } from '@/lib/guest-context';
import { GuestDashboard } from '@/components/guest-dashboard';

export default function GuestDashboardPage() {
  const { guestData } = useGuest();

  if (!guestData) return null;

  return <GuestDashboard />;
}
