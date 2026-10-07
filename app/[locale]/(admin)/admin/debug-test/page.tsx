export const dynamic = 'force-dynamic';

export default async function DebugTestPage() {
  return (
    <div style={{ padding: '40px', color: '#fff' }}>
      <h1>Admin Debug Test</h1>
      <p>If you see this, the admin layout renders correctly.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
