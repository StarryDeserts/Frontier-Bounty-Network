import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { relativeRemaining } from '@/utils/time';
export function CountdownTimer({ expiresAt }) {
    const [label, setLabel] = useState(() => relativeRemaining(expiresAt));
    useEffect(() => {
        const id = setInterval(() => setLabel(relativeRemaining(expiresAt)), 15000);
        return () => clearInterval(id);
    }, [expiresAt]);
    return _jsx("span", { children: label });
}
