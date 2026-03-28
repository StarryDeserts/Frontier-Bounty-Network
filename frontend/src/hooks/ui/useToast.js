import { useState } from 'react';
export function useToast() {
    const [message, setMessage] = useState(null);
    const push = (next) => {
        setMessage(next);
        setTimeout(() => setMessage(null), 2500);
    };
    return { message, push };
}
