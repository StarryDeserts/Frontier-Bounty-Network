import { PropsWithChildren } from 'react';

import { QueryProvider } from './QueryProvider';
import { SuiProvider } from './SuiProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <SuiProvider>{children}</SuiProvider>
    </QueryProvider>
  );
}
