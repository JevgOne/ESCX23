import { redirect } from 'next/navigation';

/**
 * Redirect /studio/booking/:id → /studio/dashboard?detail=:id
 * Detail view is rendered inline on the dashboard (matching mockup 08 Screen 2).
 */
export default async function StudioBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/studio/dashboard?detail=${id}`);
}
