import { jsx as _jsx } from "react/jsx-runtime";
import { QueryProvider } from './QueryProvider';
import { SuiProvider } from './SuiProvider';
export function AppProviders({ children }) {
    return (_jsx(QueryProvider, { children: _jsx(SuiProvider, { children: children }) }));
}
