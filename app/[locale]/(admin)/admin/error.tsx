'use client';

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f87171', marginBottom: '12px' }}>
        Admin Error
      </h1>
      <p style={{ color: '#ccc', marginBottom: '16px' }}>
        {error.message || 'Unknown error'}
      </p>
      {error.digest && (
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
          Digest: {error.digest}
        </p>
      )}
      <pre style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12px',
        color: '#aaa',
        overflow: 'auto',
        maxHeight: '300px',
        whiteSpace: 'pre-wrap',
        marginBottom: '16px',
      }}>
        {error.stack || 'No stack trace'}
      </pre>
      <button
        onClick={reset}
        style={{
          background: 'var(--color-coral, #e74c6f)',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Zkusit znovu
      </button>
    </div>
  );
}
