import { db } from '@/lib/db';
import { getWeekSchedulesForAll } from '@/lib/booking-actions';
import QuickBookingPanel from '@/components/booking/QuickBookingPanel';

export const dynamic = 'force-dynamic';

export default async function QuickBookingPage() {
  const { girls, schedules } = await getWeekSchedulesForAll();

  // Get pricing plans
  const pricingRes = await db.execute(
    'SELECT duration, price FROM pricing_plans WHERE is_active = 1 ORDER BY duration',
  );
  const pricingPlans = pricingRes.rows.map((r) => ({
    duration: Number(r.duration),
    price: Number(r.price),
  }));

  // Today in Prague
  const now = new Date();
  const pragueDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const today = `${pragueDate.getFullYear()}-${String(pragueDate.getMonth() + 1).padStart(2, '0')}-${String(pragueDate.getDate()).padStart(2, '0')}`;

  return (
    <QuickBookingPanel
      girls={girls}
      weekSchedules={schedules}
      pricingPlans={pricingPlans}
      today={today}
    />
  );
}
