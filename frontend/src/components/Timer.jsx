import { useState, useEffect } from 'react';

export default function Timer() {
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <span style={{ fontSize: 'var(--font-size-lg)', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
            [{formatTime(timer)}]
        </span>
    );
}
