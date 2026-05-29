'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function NavCloseOnRoute() {
  const pathname = usePathname();

  useEffect(() => {
    const toggle = document.getElementById('nav-toggle') as HTMLInputElement | null;
    if (toggle) toggle.checked = false;
  }, [pathname]);

  return null;
}
