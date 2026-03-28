import { jsx as _jsx } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
export function QueryProvider({ children }) {
    const [client] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 10000,
                retry: 1,
            },
        },
    }));
    return _jsx(QueryClientProvider, { client: client, children: children });
}
