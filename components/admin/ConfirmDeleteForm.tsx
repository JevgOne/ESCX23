'use client';

import type { ReactNode } from 'react';

interface ConfirmDeleteFormProps {
  action: (formData: FormData) => void;
  id: number;
  message?: string;
  children?: ReactNode;
}

export default function ConfirmDeleteForm({ action, id, message = 'Opravdu smazat?', children }: ConfirmDeleteFormProps) {
  return (
    <form
      action={action}
      style={{ display: 'inline' }}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {children ?? <button type="submit" className="admin-action-btn danger">Smazat</button>}
    </form>
  );
}
