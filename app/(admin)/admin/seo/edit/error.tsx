'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1f1f23',
      color: '#fff',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>
          Něco se pokazilo
        </h2>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          {error.message || 'Omlouváme se, ale došlo k neočekávané chybě při načítání SEO editoru.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#d4af37',
              color: '#1f1f23',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Zkusit znovu
          </button>
          <Link
            href="/admin/seo"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'inline-block'
            }}
          >
            Zpět na SEO Manager
          </Link>
        </div>
        {error.digest && (
          <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#6b7280' }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
