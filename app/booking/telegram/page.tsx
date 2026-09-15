import { requireBookingAdmin } from '@/lib/auth';

export default async function TelegramPage() {
  await requireBookingAdmin();
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>{'\u2708\uFE0F'}</div>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>TG Bot</h1>
      <p style={{ color: 'var(--dim)', fontSize: 14 }}>Ve vyvoji — bude brzy dostupne.</p>
    </div>
  );
}
