'use client';

import { useEffect, useRef } from 'react';

interface Props {
  formId: string;
}

export default function UnsavedChangesGuard({ formId }: Props) {
  const dirty = useRef(false);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;

    const markDirty = () => { dirty.current = true; };

    form.addEventListener('input', markDirty);
    form.addEventListener('change', markDirty);

    // Reset dirty flag on submit (form is being saved)
    const onSubmit = () => { dirty.current = false; };
    form.addEventListener('submit', onSubmit);

    // Warn on page unload (refresh, close tab, external navigation)
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    // Intercept clicks on nav-away links inside the form
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-nav-away]');
      if (!link || !dirty.current) return;
      const ok = window.confirm('Máte neuložené změny. Opravdu chcete odejít?');
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    form.addEventListener('click', onClick);

    return () => {
      form.removeEventListener('input', markDirty);
      form.removeEventListener('change', markDirty);
      form.removeEventListener('submit', onSubmit);
      form.removeEventListener('click', onClick);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [formId]);

  return null;
}
