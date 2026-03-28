import { useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const push = (next: string) => {
    setMessage(next);
    setTimeout(() => setMessage(null), 2500);
  };

  return { message, push };
}
