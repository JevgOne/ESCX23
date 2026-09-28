'use client';

import { useState } from 'react';
import AddContactForm from './AddContactForm';

const STYLES = `
.cs-add-btn {
  display: block; width: 100%; padding: 8px;
  background: transparent; border: 1px dashed var(--line);
  border-radius: 8px; color: var(--muted); font-size: 12px;
  font-weight: 600; cursor: pointer; font-family: inherit;
  margin-top: 8px; text-align: center;
  transition: all 0.15s;
}
.cs-add-btn:hover { border-color: var(--coral); color: var(--coral); }
`;

export default function ContactSection({
  clientId,
  children,
}: {
  clientId: number;
  children: React.ReactNode;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {children}
      {showForm ? (
        <AddContactForm clientId={clientId} onClose={() => setShowForm(false)} />
      ) : (
        <button
          type="button"
          className="cs-add-btn"
          onClick={() => setShowForm(true)}
        >
          + Pridat kontakt
        </button>
      )}
    </>
  );
}
