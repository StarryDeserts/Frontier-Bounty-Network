import { useEffect, useState } from 'react';

import { relativeRemaining } from '@/utils/time';

export function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [label, setLabel] = useState(() => relativeRemaining(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setLabel(relativeRemaining(expiresAt)), 15_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return <span>{label}</span>;
}
