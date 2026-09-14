/**
 * STUDIOFLOW — New Booking page
 * Renders the multi-step booking form as a modal overlay.
 */

import NewBookingForm from '@/components/booking/NewBookingForm';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ date?: string; girl?: string }>;
}

export default async function NewBookingPage({ searchParams }: Props) {
  const params = await searchParams;

  // Default to today (Prague timezone)
  const pragueNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const y = pragueNow.getFullYear();
  const m = String(pragueNow.getMonth() + 1).padStart(2, '0');
  const d = String(pragueNow.getDate()).padStart(2, '0');
  const today = `${y}-${m}-${d}`;

  const initialDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? params.date
    : today;

  const initialGirlId = params.girl ? parseInt(params.girl, 10) : null;

  return (
    <NewBookingForm
      initialDate={initialDate}
      initialGirlId={isNaN(initialGirlId as number) ? null : initialGirlId}
    />
  );
}
